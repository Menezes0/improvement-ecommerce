-- ==============================================================================
-- IMPROVEMENT E-COMMERCE — FUNÇÕES DE NEGÓCIO, GATILHOS E TRANSAÇÕES ATÔMICAS
-- Arquivo: 02_functions_and_triggers.sql
-- Baseado na Especificação Inicial (Fase 1 - AndradeSpec.md)
-- ==============================================================================

-- ==============================================================================
-- 1. SINCRONIZAÇÃO DE USUÁRIO DO AUTH COM TABELA PÚBLICA (RF01, RF02, RF03)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_nome TEXT;
    v_telefone TEXT;
    v_papel TEXT;
BEGIN
    v_nome := COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1));
    v_telefone := new.raw_user_meta_data->>'telefone';
    v_papel := COALESCE(new.raw_user_meta_data->>'papel', 'cliente');

    IF v_papel NOT IN ('cliente', 'operador', 'admin') THEN
        v_papel := 'cliente';
    END IF;

    INSERT INTO public.usuarios (id, email, nome, telefone, papel, ativo)
    VALUES (new.id, new.email, v_nome, v_telefone, v_papel, true)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nome = EXCLUDED.nome,
        telefone = EXCLUDED.telefone,
        atualizado_em = timezone('utc', now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Atualizador genérico de timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_produtos_updated_at ON public.produtos;
CREATE TRIGGER trg_produtos_updated_at
    BEFORE UPDATE ON public.produtos
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER trg_pedidos_updated_at
    BEFORE UPDATE ON public.pedidos
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_itens_carrinho_updated_at ON public.itens_carrinho;
CREATE TRIGGER trg_itens_carrinho_updated_at
    BEFORE UPDATE ON public.itens_carrinho
    FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 2. FUNÇÃO HELPER: PAPEL DO USUÁRIO ATUAL (RLS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_papel()
RETURNS TEXT AS $$
DECLARE
    v_papel TEXT;
BEGIN
    SELECT papel INTO v_papel 
    FROM public.usuarios 
    WHERE id = auth.uid() AND ativo = true;

    RETURN COALESCE(v_papel, 'visitante');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 3. CÁLCULO DE DISTÂNCIA HAVERSINE EM METROS (RF15, RNF07)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.calcular_distancia_haversine(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r CONSTANT DOUBLE PRECISION := 6371000.0; -- Raio da Terra em metros
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat / 2.0)^2 + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon / 2.0)^2;
         
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    
    RETURN round((r * c)::NUMERIC, 2)::DOUBLE PRECISION;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================================================
-- 4. FINALIZAÇÃO ATÔMICA DE PEDIDO (RF08, RF09, RF10, RF11, RNF10)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.finalizar_pedido(
    p_usuario_id UUID,
    p_tipo TEXT,
    p_endereco_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_pedido_id UUID;
    v_subtotal NUMERIC(10,2) := 0;
    v_frete NUMERIC(10,2) := 0;
    v_total NUMERIC(10,2) := 0;
    v_item RECORD;
    v_prod RECORD;
    v_preco_aplicado NUMERIC(10,2);
    v_count_itens INT := 0;
BEGIN
    -- Validar autenticação
    IF auth.uid() IS NULL OR (auth.uid() <> p_usuario_id AND public.get_current_user_papel() NOT IN ('admin')) THEN
        RAISE EXCEPTION 'Acesso não autorizado para finalizar este pedido.';
    END IF;

    -- Validar tipo de pedido
    IF p_tipo NOT IN ('entrega', 'retirada') THEN
        RAISE EXCEPTION 'Tipo de pedido inválido. Deve ser "entrega" ou "retirada".';
    END IF;

    -- Se entrega, validar endereço e taxa de frete
    IF p_tipo = 'entrega' THEN
        IF p_endereco_id IS NULL THEN
            RAISE EXCEPTION 'Endereço de entrega obrigatório para pedidos do tipo entrega.';
        END IF;

        SELECT z.taxa_frete INTO v_frete
        FROM public.enderecos e
        JOIN public.zonas_entrega z ON z.id = e.zona_id
        WHERE e.id = p_endereco_id AND e.usuario_id = p_usuario_id AND z.ativa = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Endereço inválido ou zona de entrega não atendida no momento.';
        END IF;
    ELSE
        -- Retirada tem frete grátis (R$ 0,00)
        v_frete := 0;
        p_endereco_id := NULL;
    END IF;

    -- Verificar se carrinho tem itens
    SELECT COUNT(*) INTO v_count_itens 
    FROM public.itens_carrinho 
    WHERE usuario_id = p_usuario_id;

    IF v_count_itens = 0 THEN
        RAISE EXCEPTION 'Carrinho vazio. Não é possível gerar pedido.';
    END IF;

    -- Criar ID do pedido
    v_pedido_id := gen_random_uuid();

    -- Criar o registro do pedido temporariamente com total zerado
    INSERT INTO public.pedidos (
        id, usuario_id, tipo, status, endereco_id, subtotal, frete, total
    ) VALUES (
        v_pedido_id, p_usuario_id, p_tipo, 'recebido', p_endereco_id, 0, v_frete, 0
    );

    -- Loop pelos itens do carrinho com trava FOR UPDATE nos produtos para atomicidade
    FOR v_item IN 
        SELECT c.produto_id, c.quantidade, c.regra_substituicao
        FROM public.itens_carrinho c
        WHERE c.usuario_id = p_usuario_id
    LOOP
        -- Bloqueio pessimista para evitar condição de corrida em concorrência (RNF10)
        SELECT id, nome, preco, estoque, ativo INTO v_prod
        FROM public.produtos
        WHERE id = v_item.produto_id
        FOR UPDATE;

        IF NOT FOUND OR v_prod.ativo = false THEN
            RAISE EXCEPTION 'O produto % não está mais disponível.', v_item.produto_id;
        END IF;

        IF v_prod.estoque < v_item.quantidade THEN
            RAISE EXCEPTION 'Estoque insuficiente para o produto "%" (Disponível: %, Solicitado: %).', 
                v_prod.nome, v_prod.estoque, v_item.quantidade;
        END IF;

        -- Verificar se há oferta promocional vigente
        SELECT COALESCE(
            (SELECT o.preco_promocional 
             FROM public.ofertas o 
             WHERE o.produto_id = v_prod.id 
               AND o.ativa = true 
               AND timezone('utc', now()) BETWEEN o.inicio AND o.fim 
             LIMIT 1),
            v_prod.preco
        ) INTO v_preco_aplicado;

        -- Inserir item no pedido
        INSERT INTO public.itens_pedido (
            pedido_id, produto_id, quantidade, preco_unitario, regra_substituicao, situacao
        ) VALUES (
            v_pedido_id, v_prod.id, v_item.quantidade, v_preco_aplicado, v_item.regra_substituicao, 'pendente'
        );

        -- Dar baixa atômica no estoque
        UPDATE public.produtos
        SET estoque = estoque - v_item.quantidade
        WHERE id = v_prod.id;

        -- Registrar histórico da movimentação
        INSERT INTO public.movimentacoes_estoque (
            produto_id, usuario_id, pedido_id, tipo, quantidade, motivo
        ) VALUES (
            v_prod.id, p_usuario_id, v_pedido_id, 'venda', -v_item.quantidade, 'Baixa automática por venda no pedido ' || v_pedido_id
        );

        -- Somar ao subtotal
        v_subtotal := v_subtotal + (v_preco_aplicado * v_item.quantidade);
    END LOOP;

    v_total := v_subtotal + v_frete;

    -- Atualizar valores finais do pedido
    UPDATE public.pedidos
    SET subtotal = v_subtotal,
        frete = v_frete,
        total = v_total
    WHERE id = v_pedido_id;

    -- Limpar o carrinho do cliente
    DELETE FROM public.itens_carrinho WHERE usuario_id = p_usuario_id;

    RETURN v_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. CANCELAMENTO DE PEDIDO PELO CLIENTE (RF13, CA19)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.cancelar_pedido(
    p_pedido_id UUID,
    p_usuario_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
    v_item RECORD;
BEGIN
    -- Validar permissão
    IF auth.uid() IS NULL OR (auth.uid() <> p_usuario_id AND public.get_current_user_papel() NOT IN ('operador', 'admin')) THEN
        RAISE EXCEPTION 'Acesso não autorizado para cancelar este pedido.';
    END IF;

    -- Buscar status atual com lock
    SELECT status INTO v_status
    FROM public.pedidos
    WHERE id = p_pedido_id AND (usuario_id = p_usuario_id OR public.get_current_user_papel() IN ('operador', 'admin'))
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado.';
    END IF;

    IF v_status <> 'recebido' THEN
        RAISE EXCEPTION 'Apenas pedidos com status "recebido" podem ser cancelados.';
    END IF;

    -- Devolver itens ao estoque
    FOR v_item IN
        SELECT produto_id, quantidade 
        FROM public.itens_pedido 
        WHERE pedido_id = p_pedido_id AND situacao <> 'cortado'
    LOOP
        UPDATE public.produtos
        SET estoque = estoque + v_item.quantidade
        WHERE id = v_item.produto_id;

        INSERT INTO public.movimentacoes_estoque (
            produto_id, usuario_id, pedido_id, tipo, quantidade, motivo
        ) VALUES (
            v_item.produto_id, p_usuario_id, p_pedido_id, 'cancelamento', v_item.quantidade, 'Devolução por cancelamento do pedido'
        );
    END LOOP;

    -- Marcar como cancelado
    UPDATE public.pedidos
    SET status = 'cancelado',
        atualizado_em = timezone('utc', now())
    WHERE id = p_pedido_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. TRANSIÇÃO DE STATUS DO PEDIDO PELO OPERADOR (RF21, CA28)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.atualizar_status_pedido(
    p_pedido_id UUID,
    p_novo_status TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_tipo TEXT;
    v_status_atual TEXT;
    v_valido BOOLEAN := false;
BEGIN
    IF public.get_current_user_papel() NOT IN ('operador', 'admin') THEN
        RAISE EXCEPTION 'Apenas operadores ou administradores podem alterar o status do pedido.';
    END IF;

    SELECT tipo, status INTO v_tipo, v_status_atual
    FROM public.pedidos
    WHERE id = p_pedido_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado.';
    END IF;

    -- Regras da Seção 6.4:
    -- Retirada: recebido -> em_separacao -> pronto -> concluido
    -- Entrega:  recebido -> em_separacao -> saiu_para_entrega -> concluido
    IF v_tipo = 'retirada' THEN
        IF (v_status_atual = 'recebido' AND p_novo_status = 'em_separacao') OR
           (v_status_atual = 'em_separacao' AND p_novo_status = 'pronto') OR
           (v_status_atual = 'pronto' AND p_novo_status = 'concluido') THEN
            v_valido := true;
        END IF;
    ELSIF v_tipo = 'entrega' THEN
        IF (v_status_atual = 'recebido' AND p_novo_status = 'em_separacao') OR
           (v_status_atual = 'em_separacao' AND p_novo_status = 'saiu_para_entrega') OR
           (v_status_atual = 'saiu_para_entrega' AND p_novo_status = 'concluido') THEN
            v_valido := true;
        END IF;
    END IF;

    IF NOT v_valido THEN
        RAISE EXCEPTION 'Transição de status inválida para pedido de %: de "%" para "%".', 
            v_tipo, v_status_atual, p_novo_status;
    END IF;

    UPDATE public.pedidos
    SET status = p_novo_status,
        atualizado_em = timezone('utc', now())
    WHERE id = p_pedido_id;

    RETURN p_novo_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 7. SEPARAÇÃO E TRATAMENTO DE RUPTURA PELO OPERADOR (RF22, CA29, CA30)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.tratar_ruptura_item(
    p_item_pedido_id UUID,
    p_situacao TEXT, -- 'separado', 'substituido' ou 'cortado'
    p_produto_substituto_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_item RECORD;
    v_prod_orig RECORD;
    v_prod_sub RECORD;
    v_novo_subtotal NUMERIC(10,2);
    v_frete NUMERIC(10,2);
BEGIN
    IF public.get_current_user_papel() NOT IN ('operador', 'admin') THEN
        RAISE EXCEPTION 'Apenas operadores ou administradores podem separar itens.';
    END IF;

    SELECT ip.*, p.status as pedido_status, p.frete as pedido_frete
    INTO v_item
    FROM public.itens_pedido ip
    JOIN public.pedidos p ON p.id = ip.pedido_id
    WHERE ip.id = p_item_pedido_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item do pedido não encontrado.';
    END IF;

    IF v_item.pedido_status <> 'em_separacao' THEN
        RAISE EXCEPTION 'O pedido deve estar "em_separacao" para tratar itens.';
    END IF;

    IF p_situacao = 'separado' THEN
        UPDATE public.itens_pedido
        SET situacao = 'separado'
        WHERE id = p_item_pedido_id;

    ELSIF p_situacao = 'substituido' THEN
        IF v_item.regra_substituicao <> 'troca_marca' THEN
            RAISE EXCEPTION 'Este item não permite substituição (regra: %).', v_item.regra_substituicao;
        END IF;

        IF p_produto_substituto_id IS NULL THEN
            RAISE EXCEPTION 'Produto substituto deve ser informado.';
        END IF;

        -- Obter categorias e validar estoque do substituto
        SELECT categoria_id INTO v_prod_orig FROM public.produtos WHERE id = v_item.produto_id;
        SELECT * INTO v_prod_sub FROM public.produtos WHERE id = p_produto_substituto_id FOR UPDATE;

        IF NOT FOUND OR v_prod_sub.ativo = false THEN
            RAISE EXCEPTION 'Produto substituto inválido ou inativo.';
        END IF;

        IF v_prod_sub.categoria_id <> v_prod_orig.categoria_id THEN
            RAISE EXCEPTION 'Produto substituto deve pertencer à mesma categoria.';
        END IF;

        IF v_prod_sub.estoque < v_item.quantidade THEN
            RAISE EXCEPTION 'Produto substituto sem estoque suficiente (% disponível).', v_prod_sub.estoque;
        END IF;

        -- Dar baixa no substituto e devolver o original (se já havia sido deduzido)
        UPDATE public.produtos SET estoque = estoque - v_item.quantidade WHERE id = v_prod_sub.id;
        UPDATE public.produtos SET estoque = estoque + v_item.quantidade WHERE id = v_item.produto_id;

        -- Registrar trocas no log de estoque
        INSERT INTO public.movimentacoes_estoque (produto_id, usuario_id, pedido_id, tipo, quantidade, motivo)
        VALUES (v_item.produto_id, auth.uid(), v_item.pedido_id, 'ajuste', v_item.quantidade, 'Retorno ao estoque por substituição de marca');

        INSERT INTO public.movimentacoes_estoque (produto_id, usuario_id, pedido_id, tipo, quantidade, motivo)
        VALUES (v_prod_sub.id, auth.uid(), v_item.pedido_id, 'venda', -v_item.quantidade, 'Saída por item substituto no pedido');

        -- Atualizar item com o substituto e preço do substituto
        UPDATE public.itens_pedido
        SET situacao = 'substituido',
            produto_substituto_id = p_produto_substituto_id,
            preco_unitario = v_prod_sub.preco
        WHERE id = p_item_pedido_id;

    ELSIF p_situacao = 'cortado' THEN
        -- Se não substituir ou sem opção, corta o item e estorna estoque
        UPDATE public.produtos SET estoque = estoque + v_item.quantidade WHERE id = v_item.produto_id;

        INSERT INTO public.movimentacoes_estoque (produto_id, usuario_id, pedido_id, tipo, quantidade, motivo)
        VALUES (v_item.produto_id, auth.uid(), v_item.pedido_id, 'ajuste', v_item.quantidade, 'Estorno de estoque por corte de item indisponível');

        UPDATE public.itens_pedido
        SET situacao = 'cortado'
        WHERE id = p_item_pedido_id;
    ELSE
        RAISE EXCEPTION 'Situação inválida: %', p_situacao;
    END IF;

    -- Recalcular subtotal e total do pedido
    SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
    INTO v_novo_subtotal
    FROM public.itens_pedido
    WHERE pedido_id = v_item.pedido_id AND situacao <> 'cortado';

    UPDATE public.pedidos
    SET subtotal = v_novo_subtotal,
        total = v_novo_subtotal + frete,
        atualizado_em = timezone('utc', now())
    WHERE id = v_item.pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. CLIQUES E RETIRE — GEOLOCALIZAÇÃO E AVISOS (RF14, RF15, RF16, RF17, RNF07)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.registrar_aviso_aproximacao(
    p_pedido_id UUID,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION
)
RETURNS JSONB AS $$
DECLARE
    v_pedido RECORD;
    v_loja RECORD;
    v_distancia DOUBLE PRECISION;
    v_aviso_existente INT;
    v_aviso_criado BOOLEAN := false;
BEGIN
    -- Validar pedido
    SELECT * INTO v_pedido
    FROM public.pedidos
    WHERE id = p_pedido_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado.';
    END IF;

    IF v_pedido.usuario_id <> auth.uid() AND public.get_current_user_papel() NOT IN ('admin') THEN
        RAISE EXCEPTION 'Acesso não autorizado.';
    END IF;

    IF v_pedido.tipo <> 'retirada' THEN
        RAISE EXCEPTION 'Apenas pedidos de retirada possuem aviso de aproximação.';
    END IF;

    IF v_pedido.status NOT IN ('recebido', 'em_separacao', 'pronto') THEN
        RAISE EXCEPTION 'Aviso de aproximação indisponível para o status atual (%):', v_pedido.status;
    END IF;

    -- Obter coordenadas da loja
    SELECT latitude, longitude, raio_aviso_m INTO v_loja
    FROM public.config_loja
    WHERE id = 1;

    -- Calcular distância com Haversine
    v_distancia := public.calcular_distancia_haversine(
        p_latitude, p_longitude, v_loja.latitude, v_loja.longitude
    );

    -- Atualizar o pedido (RNF07: NUNCA grava latitude e longitude, apenas distância e status a_caminho!)
    UPDATE public.pedidos
    SET a_caminho = true,
        ultima_distancia_m = v_distancia,
        atualizado_em = timezone('utc', now())
    WHERE id = p_pedido_id;

    -- Se dentro do raio, gerar UM ÚNICO aviso de aproximação (RF15, CA21)
    IF v_distancia <= v_loja.raio_aviso_m THEN
        SELECT COUNT(*) INTO v_aviso_existente
        FROM public.avisos_chegada
        WHERE pedido_id = p_pedido_id AND tipo = 'aproximacao';

        IF v_aviso_existente = 0 THEN
            INSERT INTO public.avisos_chegada (pedido_id, tipo, distancia_m)
            VALUES (p_pedido_id, 'aproximacao', v_distancia);
            v_aviso_criado := true;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'pedido_id', p_pedido_id,
        'distancia_m', v_distancia,
        'dentro_do_raio', (v_distancia <= v_loja.raio_aviso_m),
        'aviso_gerado', v_aviso_criado
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Botão manual "Cheguei" (RF16, CA23)
CREATE OR REPLACE FUNCTION public.registrar_aviso_cheguei(
    p_pedido_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_pedido RECORD;
    v_aviso_id UUID;
    v_distancia NUMERIC(10,2);
BEGIN
    SELECT * INTO v_pedido
    FROM public.pedidos
    WHERE id = p_pedido_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido não encontrado.';
    END IF;

    IF v_pedido.usuario_id <> auth.uid() AND public.get_current_user_papel() NOT IN ('admin') THEN
        RAISE EXCEPTION 'Acesso não autorizado.';
    END IF;

    IF v_pedido.tipo <> 'retirada' THEN
        RAISE EXCEPTION 'Apenas pedidos de retirada podem emitir aviso de chegada.';
    END IF;

    v_distancia := COALESCE(v_pedido.ultima_distancia_m, 0);

    INSERT INTO public.avisos_chegada (pedido_id, tipo, distancia_m)
    VALUES (p_pedido_id, 'cheguei', v_distancia)
    RETURNING id INTO v_aviso_id;

    RETURN v_aviso_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atendimento do aviso pelo operador (RF17, CA24)
CREATE OR REPLACE FUNCTION public.atender_aviso_chegada(
    p_aviso_id UUID
)
RETURNS VOID AS $$
BEGIN
    IF public.get_current_user_papel() NOT IN ('operador', 'admin') THEN
        RAISE EXCEPTION 'Apenas operadores ou administradores podem atender avisos de chegada.';
    END IF;

    UPDATE public.avisos_chegada
    SET atendido_em = timezone('utc', now()),
        atendido_por = auth.uid()
    WHERE id = p_aviso_id AND atendido_em IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 9. AJUSTE MANUAL DE ESTOQUE PELO OPERADOR (RF19, CA26)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.ajustar_estoque_manual(
    p_produto_id UUID,
    p_tipo TEXT, -- 'entrada', 'saida', 'ajuste'
    p_quantidade INT,
    p_motivo TEXT
)
RETURNS INT AS $$
DECLARE
    v_estoque_atual INT;
    v_novo_estoque INT;
    v_delta INT;
BEGIN
    IF public.get_current_user_papel() NOT IN ('operador', 'admin') THEN
        RAISE EXCEPTION 'Apenas operadores ou administradores podem ajustar o estoque.';
    END IF;

    IF p_quantidade <= 0 THEN
        RAISE EXCEPTION 'A quantidade informada deve ser maior que zero.';
    END IF;

    SELECT estoque INTO v_estoque_atual
    FROM public.produtos
    WHERE id = p_produto_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produto não encontrado.';
    END IF;

    IF p_tipo = 'entrada' THEN
        v_novo_estoque := v_estoque_atual + p_quantidade;
        v_delta := p_quantidade;
    ELSIF p_tipo = 'saida' THEN
        IF v_estoque_atual < p_quantidade THEN
            RAISE EXCEPTION 'Estoque não pode ficar negativo. Estoque atual: %', v_estoque_atual;
        END IF;
        v_novo_estoque := v_estoque_atual - p_quantidade;
        v_delta := -p_quantidade;
    ELSIF p_tipo = 'ajuste' THEN
        v_novo_estoque := p_quantidade;
        v_delta := p_quantidade - v_estoque_atual;
    ELSE
        RAISE EXCEPTION 'Tipo de ajuste inválido: %. Use entrada, saida ou ajuste.', p_tipo;
    END IF;

    UPDATE public.produtos
    SET estoque = v_novo_estoque
    WHERE id = p_produto_id;

    INSERT INTO public.movimentacoes_estoque (
        produto_id, usuario_id, tipo, quantidade, motivo
    ) VALUES (
        p_produto_id, auth.uid(), p_tipo, v_delta, p_motivo
    );

    RETURN v_novo_estoque;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
