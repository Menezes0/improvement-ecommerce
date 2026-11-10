-- ==============================================================================
-- IMPROVEMENT E-COMMERCE — SCRIPT UNIFICADO COMPLETO (ALL-IN-ONE)
-- Arquivo: full_database_setup.sql
-- Projeto: Improvement e-commerce (IFRO Campus Porto Velho Calama)
--
-- Este script executa em ordem:
--   1. Criação das tabelas, chaves e índices (01_schema.sql)
--   2. Habilitação do Supabase Realtime (produtos, pedidos, avisos_chegada, ofertas)
--   3. Funções de regras de negócio, atomicidade e gatilhos (02_functions_and_triggers.sql)
--   4. Políticas de segurança por linha - RLS (03_rls_policies.sql)
--   5. Procedimento de carga e restauração de dados simulados (04_seed_data.sql)
--
-- Pode ser colado diretamente no SQL Editor do dashboard do Supabase e executado de uma só vez!
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: HABILITAR EXTENSÕES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- PARTE 2: TABELAS DO MODELO RELACIONAL
-- ==============================================================================

-- 2.1 Perfil público de Usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    telefone TEXT,
    papel TEXT NOT NULL CHECK (papel IN ('cliente', 'operador', 'admin')) DEFAULT 'cliente',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.2 Zonas de Entrega
CREATE TABLE IF NOT EXISTS public.zonas_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bairro TEXT NOT NULL UNIQUE,
    taxa_frete NUMERIC(10,2) NOT NULL CHECK (taxa_frete >= 0),
    prazo_estimado_min INT NOT NULL CHECK (prazo_estimado_min > 0),
    ativa BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.3 Endereços dos Clientes
CREATE TABLE IF NOT EXISTS public.enderecos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    zona_id UUID NOT NULL REFERENCES public.zonas_entrega(id) ON DELETE RESTRICT,
    apelido TEXT,
    logradouro TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    cep TEXT NOT NULL,
    padrao BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.4 Categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.5 Produtos do Catálogo
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
    nome TEXT NOT NULL,
    marca TEXT NOT NULL,
    descricao TEXT,
    preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    estoque INT NOT NULL CHECK (estoque >= 0) DEFAULT 0,
    sem_lactose BOOLEAN NOT NULL DEFAULT false,
    sem_gluten BOOLEAN NOT NULL DEFAULT false,
    vegano BOOLEAN NOT NULL DEFAULT false,
    ativo BOOLEAN NOT NULL DEFAULT true,
    imagem_url TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.6 Mural de Ofertas
CREATE TABLE IF NOT EXISTS public.ofertas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    preco_promocional NUMERIC(10,2) NOT NULL CHECK (preco_promocional >= 0),
    inicio TIMESTAMPTZ NOT NULL,
    fim TIMESTAMPTZ NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT check_oferta_datas CHECK (fim > inicio)
);

-- 2.7 Itens do Carrinho
CREATE TABLE IF NOT EXISTS public.itens_carrinho (
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    regra_substituicao TEXT NOT NULL CHECK (regra_substituicao IN ('troca_marca', 'nao_substituir')) DEFAULT 'nao_substituir',
    adicionado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    PRIMARY KEY (usuario_id, produto_id)
);

-- 2.8 Pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrega', 'retirada')),
    status TEXT NOT NULL CHECK (status IN ('recebido', 'em_separacao', 'pronto', 'saiu_para_entrega', 'concluido', 'cancelado')) DEFAULT 'recebido',
    endereco_id UUID REFERENCES public.enderecos(id) ON DELETE SET NULL,
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    frete NUMERIC(10,2) NOT NULL CHECK (frete >= 0) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    a_caminho BOOLEAN NOT NULL DEFAULT false,
    ultima_distancia_m NUMERIC(10,2),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.9 Itens do Pedido
CREATE TABLE IF NOT EXISTS public.itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    produto_substituto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
    regra_substituicao TEXT NOT NULL CHECK (regra_substituicao IN ('troca_marca', 'nao_substituir')),
    situacao TEXT NOT NULL CHECK (situacao IN ('pendente', 'separado', 'substituido', 'cortado')) DEFAULT 'pendente',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.10 Movimentações de Estoque
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'venda', 'cancelamento')),
    quantidade INT NOT NULL,
    motivo TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.11 Avisos de Chegada (Clique e Retire)
CREATE TABLE IF NOT EXISTS public.avisos_chegada (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('aproximacao', 'cheguei')),
    distancia_m NUMERIC(10,2) NOT NULL,
    atendido_em TIMESTAMPTZ,
    atendido_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.12 Configuração Geral da Loja
CREATE TABLE IF NOT EXISTS public.config_loja (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nome TEXT NOT NULL DEFAULT 'Supermercado Modelo Porto Velho',
    latitude DOUBLE PRECISION NOT NULL DEFAULT -8.761800,
    longitude DOUBLE PRECISION NOT NULL DEFAULT -63.902000,
    raio_aviso_m INT NOT NULL DEFAULT 1000 CHECK (raio_aviso_m > 0),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- PARTE 3: ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_filtros ON public.produtos(ativo, sem_lactose, sem_gluten, vegano);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON public.produtos USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_ofertas_vigencia ON public.ofertas(produto_id, ativa, inicio, fim);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON public.pedidos(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON public.itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_avisos_pendentes ON public.avisos_chegada(atendido_em) WHERE atendido_em IS NULL;
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto ON public.movimentacoes_estoque(produto_id, criado_em);

-- ==============================================================================
-- PARTE 4: PUBLICAÇÃO SUPABASE REALTIME
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'produtos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.produtos;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pedidos'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'avisos_chegada'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.avisos_chegada;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ofertas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ofertas;
    END IF;
END $$;

-- ==============================================================================
-- PARTE 5: FUNÇÕES E GATILHOS
-- ==============================================================================

-- 5.1 Sincronização de usuário Auth -> Tabela pública
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Atualizador de updated_at
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

-- 5.2 Obter papel do usuário logado
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

-- 5.3 Cálculo de distância Haversine
CREATE OR REPLACE FUNCTION public.calcular_distancia_haversine(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    r CONSTANT DOUBLE PRECISION := 6371000.0;
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

-- 5.4 Finalização atômica de pedido
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
    IF auth.uid() IS NULL OR (auth.uid() <> p_usuario_id AND public.get_current_user_papel() NOT IN ('admin')) THEN
        RAISE EXCEPTION 'Acesso não autorizado para finalizar este pedido.';
    END IF;

    IF p_tipo NOT IN ('entrega', 'retirada') THEN
        RAISE EXCEPTION 'Tipo de pedido inválido. Deve ser "entrega" ou "retirada".';
    END IF;

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
        v_frete := 0;
        p_endereco_id := NULL;
    END IF;

    SELECT COUNT(*) INTO v_count_itens 
    FROM public.itens_carrinho 
    WHERE usuario_id = p_usuario_id;

    IF v_count_itens = 0 THEN
        RAISE EXCEPTION 'Carrinho vazio. Não é possível gerar pedido.';
    END IF;

    v_pedido_id := gen_random_uuid();

    INSERT INTO public.pedidos (
        id, usuario_id, tipo, status, endereco_id, subtotal, frete, total
    ) VALUES (
        v_pedido_id, p_usuario_id, p_tipo, 'recebido', p_endereco_id, 0, v_frete, 0
    );

    FOR v_item IN 
        SELECT c.produto_id, c.quantidade, c.regra_substituicao
        FROM public.itens_carrinho c
        WHERE c.usuario_id = p_usuario_id
    LOOP
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

        SELECT COALESCE(
            (SELECT o.preco_promocional 
             FROM public.ofertas o 
             WHERE o.produto_id = v_prod.id 
               AND o.ativa = true 
               AND timezone('utc', now()) BETWEEN o.inicio AND o.fim 
             LIMIT 1),
            v_prod.preco
        ) INTO v_preco_aplicado;

        INSERT INTO public.itens_pedido (
            pedido_id, produto_id, quantidade, preco_unitario, regra_substituicao, situacao
        ) VALUES (
            v_pedido_id, v_prod.id, v_item.quantidade, v_preco_aplicado, v_item.regra_substituicao, 'pendente'
        );

        UPDATE public.produtos
        SET estoque = estoque - v_item.quantidade
        WHERE id = v_prod.id;

        INSERT INTO public.movimentacoes_estoque (
            produto_id, usuario_id, pedido_id, tipo, quantidade, motivo
        ) VALUES (
            v_prod.id, p_usuario_id, v_pedido_id, 'venda', -v_item.quantidade, 'Baixa automática por venda no pedido ' || v_pedido_id
        );

        v_subtotal := v_subtotal + (v_preco_aplicado * v_item.quantidade);
    END LOOP;

    v_total := v_subtotal + v_frete;

    UPDATE public.pedidos
    SET subtotal = v_subtotal,
        frete = v_frete,
        total = v_total
    WHERE id = v_pedido_id;

    DELETE FROM public.itens_carrinho WHERE usuario_id = p_usuario_id;

    RETURN v_pedido_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.5 Cancelamento de pedido
CREATE OR REPLACE FUNCTION public.cancelar_pedido(
    p_pedido_id UUID,
    p_usuario_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
    v_item RECORD;
BEGIN
    IF auth.uid() IS NULL OR (auth.uid() <> p_usuario_id AND public.get_current_user_papel() NOT IN ('operador', 'admin')) THEN
        RAISE EXCEPTION 'Acesso não autorizado para cancelar este pedido.';
    END IF;

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

    UPDATE public.pedidos
    SET status = 'cancelado',
        atualizado_em = timezone('utc', now())
    WHERE id = p_pedido_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.6 Atualização de status com máquina de estados
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

-- 5.7 Separação de itens e tratamento de ruptura
CREATE OR REPLACE FUNCTION public.tratar_ruptura_item(
    p_item_pedido_id UUID,
    p_situacao TEXT,
    p_produto_substituto_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_item RECORD;
    v_prod_orig RECORD;
    v_prod_sub RECORD;
    v_novo_subtotal NUMERIC(10,2);
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

        UPDATE public.produtos SET estoque = estoque - v_item.quantidade WHERE id = v_prod_sub.id;
        UPDATE public.produtos SET estoque = estoque + v_item.quantidade WHERE id = v_item.produto_id;

        INSERT INTO public.movimentacoes_estoque (produto_id, usuario_id, pedido_id, tipo, quantidade, motivo)
        VALUES (v_item.produto_id, auth.uid(), v_item.pedido_id, 'ajuste', v_item.quantidade, 'Retorno ao estoque por substituição de marca');

        INSERT INTO public.movimentacoes_estoque (produto_id, usuario_id, pedido_id, tipo, quantidade, motivo)
        VALUES (v_prod_sub.id, auth.uid(), v_item.pedido_id, 'venda', -v_item.quantidade, 'Saída por item substituto no pedido');

        UPDATE public.itens_pedido
        SET situacao = 'substituido',
            produto_substituto_id = p_produto_substituto_id,
            preco_unitario = v_prod_sub.preco
        WHERE id = p_item_pedido_id;

    ELSIF p_situacao = 'cortado' THEN
        UPDATE public.produtos SET estoque = estoque + v_item.quantidade WHERE id = v_item.produto_id;

        INSERT INTO public.movimentacoes_estoque (produto_id, usuario_id, pedido_id, tipo, quantidade, motivo)
        VALUES (v_item.produto_id, auth.uid(), v_item.pedido_id, 'ajuste', v_item.quantidade, 'Estorno de estoque por corte de item indisponível');

        UPDATE public.itens_pedido
        SET situacao = 'cortado'
        WHERE id = p_item_pedido_id;
    ELSE
        RAISE EXCEPTION 'Situação inválida: %', p_situacao;
    END IF;

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

-- 5.8 Avisos de aproximação e geolocalização (RNF07)
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

    SELECT latitude, longitude, raio_aviso_m INTO v_loja
    FROM public.config_loja
    WHERE id = 1;

    v_distancia := public.calcular_distancia_haversine(
        p_latitude, p_longitude, v_loja.latitude, v_loja.longitude
    );

    UPDATE public.pedidos
    SET a_caminho = true,
        ultima_distancia_m = v_distancia,
        atualizado_em = timezone('utc', now())
    WHERE id = p_pedido_id;

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

CREATE OR REPLACE FUNCTION public.ajustar_estoque_manual(
    p_produto_id UUID,
    p_tipo TEXT,
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

-- ==============================================================================
-- PARTE 6: POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_carrinho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_chegada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_loja ENABLE ROW LEVEL SECURITY;

-- Usuarios
DROP POLICY IF EXISTS "Usuarios podem ler seu próprio perfil ou operadores/admin podem ler todos" ON public.usuarios;
CREATE POLICY "Usuarios podem ler seu próprio perfil ou operadores/admin podem ler todos"
ON public.usuarios FOR SELECT
USING (id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin'));

DROP POLICY IF EXISTS "Usuarios podem editar seu próprio perfil e admin pode alterar qualquer um" ON public.usuarios;
CREATE POLICY "Usuarios podem editar seu próprio perfil e admin pode alterar qualquer um"
ON public.usuarios FOR UPDATE
USING (id = auth.uid() OR public.get_current_user_papel() = 'admin')
WITH CHECK ((id = auth.uid() AND papel = (SELECT papel FROM public.usuarios WHERE id = auth.uid())) OR public.get_current_user_papel() = 'admin');

-- Zonas de entrega
DROP POLICY IF EXISTS "Leitura pública de zonas de entrega ativas" ON public.zonas_entrega;
CREATE POLICY "Leitura pública de zonas de entrega ativas"
ON public.zonas_entrega FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admin pode gerenciar zonas de entrega" ON public.zonas_entrega;
CREATE POLICY "Apenas admin pode gerenciar zonas de entrega"
ON public.zonas_entrega FOR ALL
USING (public.get_current_user_papel() = 'admin')
WITH CHECK (public.get_current_user_papel() = 'admin');

-- Endereços
DROP POLICY IF EXISTS "Clientes visualizam seus próprios endereços ou operadores" ON public.enderecos;
CREATE POLICY "Clientes visualizam seus próprios endereços ou operadores"
ON public.enderecos FOR SELECT
USING (usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin'));

DROP POLICY IF EXISTS "Clientes gerenciam seus próprios endereços" ON public.enderecos;
CREATE POLICY "Clientes gerenciam seus próprios endereços"
ON public.enderecos FOR ALL
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- Categorias
DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.categorias;
CREATE POLICY "Leitura pública de categorias"
ON public.categorias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Operadores e admin podem alterar categorias" ON public.categorias;
CREATE POLICY "Operadores e admin podem alterar categorias"
ON public.categorias FOR ALL
USING (public.get_current_user_papel() IN ('operador', 'admin'))
WITH CHECK (public.get_current_user_papel() IN ('operador', 'admin'));

-- Produtos
DROP POLICY IF EXISTS "Visitantes e clientes veem produtos ativos; operadores veem todos" ON public.produtos;
CREATE POLICY "Visitantes e clientes veem produtos ativos; operadores veem todos"
ON public.produtos FOR SELECT
USING (ativo = true OR public.get_current_user_papel() IN ('operador', 'admin'));

DROP POLICY IF EXISTS "Operadores e admin podem gerenciar produtos" ON public.produtos;
CREATE POLICY "Operadores e admin podem gerenciar produtos"
ON public.produtos FOR ALL
USING (public.get_current_user_papel() IN ('operador', 'admin'))
WITH CHECK (public.get_current_user_papel() IN ('operador', 'admin'));

-- Ofertas
DROP POLICY IF EXISTS "Visitantes e clientes veem ofertas ativas e vigentes" ON public.ofertas;
CREATE POLICY "Visitantes e clientes veem ofertas ativas e vigentes"
ON public.ofertas FOR SELECT
USING ((ativa = true AND timezone('utc', now()) BETWEEN inicio AND fim) OR public.get_current_user_papel() IN ('operador', 'admin'));

DROP POLICY IF EXISTS "Operadores e admin gerenciam ofertas" ON public.ofertas;
CREATE POLICY "Operadores e admin gerenciam ofertas"
ON public.ofertas FOR ALL
USING (public.get_current_user_papel() IN ('operador', 'admin'))
WITH CHECK (public.get_current_user_papel() IN ('operador', 'admin'));

-- Itens Carrinho
DROP POLICY IF EXISTS "Clientes têm acesso total exclusivamente ao seu próprio carrinho" ON public.itens_carrinho;
CREATE POLICY "Clientes têm acesso total exclusivamente ao seu próprio carrinho"
ON public.itens_carrinho FOR ALL
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- Pedidos
DROP POLICY IF EXISTS "Clientes visualizam apenas seus pedidos; equipe vê todos" ON public.pedidos;
CREATE POLICY "Clientes visualizam apenas seus pedidos; equipe vê todos"
ON public.pedidos FOR SELECT
USING (usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin'));

DROP POLICY IF EXISTS "Clientes podem criar pedidos para si próprios" ON public.pedidos;
CREATE POLICY "Clientes podem criar pedidos para si próprios"
ON public.pedidos FOR INSERT
WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Operadores ou clientes (para a_caminho/cancelar) podem atualizar pedidos" ON public.pedidos;
CREATE POLICY "Operadores ou clientes (para a_caminho/cancelar) podem atualizar pedidos"
ON public.pedidos FOR UPDATE
USING (usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin'));

-- Itens Pedido
DROP POLICY IF EXISTS "Acesso aos itens do pedido conforme acesso ao pedido" ON public.itens_pedido;
CREATE POLICY "Acesso aos itens do pedido conforme acesso ao pedido"
ON public.itens_pedido FOR SELECT
USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = itens_pedido.pedido_id AND (p.usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin'))));

DROP POLICY IF EXISTS "Criação de itens permitida pelo dono do pedido" ON public.itens_pedido;
CREATE POLICY "Criação de itens permitida pelo dono do pedido"
ON public.itens_pedido FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = itens_pedido.pedido_id AND p.usuario_id = auth.uid()));

DROP POLICY IF EXISTS "Apenas operadores e admin alteram itens do pedido (separação)" ON public.itens_pedido;
CREATE POLICY "Apenas operadores e admin alteram itens do pedido (separação)"
ON public.itens_pedido FOR UPDATE
USING (public.get_current_user_papel() IN ('operador', 'admin'));

-- Movimentações Estoque
DROP POLICY IF EXISTS "Apenas operadores e admin visualizam movimentações de estoque" ON public.movimentacoes_estoque;
CREATE POLICY "Apenas operadores e admin visualizam movimentações de estoque"
ON public.movimentacoes_estoque FOR SELECT
USING (public.get_current_user_papel() IN ('operador', 'admin'));

DROP POLICY IF EXISTS "Apenas operadores e admin inserem movimentações diretas" ON public.movimentacoes_estoque;
CREATE POLICY "Apenas operadores e admin inserem movimentações diretas"
ON public.movimentacoes_estoque FOR INSERT
WITH CHECK (public.get_current_user_papel() IN ('operador', 'admin') OR usuario_id = auth.uid());

-- Avisos Chegada
DROP POLICY IF EXISTS "Dono do pedido ou equipe veem avisos de chegada" ON public.avisos_chegada;
CREATE POLICY "Dono do pedido ou equipe veem avisos de chegada"
ON public.avisos_chegada FOR SELECT
USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = avisos_chegada.pedido_id AND (p.usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin'))));

DROP POLICY IF EXISTS "Dono do pedido pode registrar aviso de chegada" ON public.avisos_chegada;
CREATE POLICY "Dono do pedido pode registrar aviso de chegada"
ON public.avisos_chegada FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = avisos_chegada.pedido_id AND p.usuario_id = auth.uid()));

DROP POLICY IF EXISTS "Operadores e admin podem atender avisos de chegada" ON public.avisos_chegada;
CREATE POLICY "Operadores e admin podem atender avisos de chegada"
ON public.avisos_chegada FOR UPDATE
USING (public.get_current_user_papel() IN ('operador', 'admin'));

-- Config Loja
DROP POLICY IF EXISTS "Leitura pública da configuração da loja" ON public.config_loja;
CREATE POLICY "Leitura pública da configuração da loja"
ON public.config_loja FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admin pode alterar a configuração da loja" ON public.config_loja;
CREATE POLICY "Apenas admin pode alterar a configuração da loja"
ON public.config_loja FOR UPDATE
USING (public.get_current_user_papel() = 'admin')
WITH CHECK (public.get_current_user_papel() = 'admin');

-- ==============================================================================
-- PARTE 7: CARGA DE DADOS SIMULADOS (RF25, CA33)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.restaurar_dados_simulados()
RETURNS TEXT AS $$
DECLARE
    cat_hortifruti UUID := '11111111-0000-0000-0000-000000000001';
    cat_padaria    UUID := '11111111-0000-0000-0000-000000000002';
    cat_laticinios UUID := '11111111-0000-0000-0000-000000000003';
    cat_mercearia  UUID := '11111111-0000-0000-0000-000000000004';
    cat_carnes     UUID := '11111111-0000-0000-0000-000000000005';
    cat_bebidas    UUID := '11111111-0000-0000-0000-000000000006';
    cat_limpeza    UUID := '11111111-0000-0000-0000-000000000007';
    cat_higiene    UUID := '11111111-0000-0000-0000-000000000008';
    cat_saudavel   UUID := '11111111-0000-0000-0000-000000000009';

    zona_olaria    UUID := '22222222-0000-0000-0000-000000000001';
    zona_caiari    UUID := '22222222-0000-0000-0000-000000000002';
    zona_centro    UUID := '22222222-0000-0000-0000-000000000003';
    zona_embratel  UUID := '22222222-0000-0000-0000-000000000004';
    zona_cristovao UUID := '22222222-0000-0000-0000-000000000005';
    zona_riomadeira UUID := '22222222-0000-0000-0000-000000000006';

    usr_admin    UUID := 'a0000000-0000-0000-0000-000000000001';
    usr_operador UUID := 'b0000000-0000-0000-0000-000000000002';
    usr_cliente1 UUID := 'c0000000-0000-0000-0000-000000000003';
    usr_cliente2 UUID := 'c0000000-0000-0000-0000-000000000004';

    v_senha_hash TEXT;

    prod_arroz5kg UUID := '33333333-0000-0000-0000-000000000001';
    prod_leite1l  UUID := '33333333-0000-0000-0000-000000000002';
    prod_leite_exp UUID := '33333333-0000-0000-0000-000000000003';
    prod_cafe     UUID := '33333333-0000-0000-0000-000000000004';
    prod_deterg   UUID := '33333333-0000-0000-0000-000000000005';
    prod_azeite   UUID := '33333333-0000-0000-0000-000000000006';
    prod_guarana  UUID := '33333333-0000-0000-0000-000000000007';

BEGIN
    v_senha_hash := crypt('Senha@123', gen_salt('bf', 10));

    DELETE FROM public.avisos_chegada;
    DELETE FROM public.itens_pedido;
    DELETE FROM public.movimentacoes_estoque;
    DELETE FROM public.pedidos;
    DELETE FROM public.itens_carrinho;
    DELETE FROM public.ofertas;
    DELETE FROM public.produtos;
    DELETE FROM public.categorias;
    DELETE FROM public.enderecos;
    DELETE FROM public.zonas_entrega;

    INSERT INTO public.config_loja (id, nome, latitude, longitude, raio_aviso_m)
    VALUES (1, 'Improvement Supermercados — Loja Porto Velho', -8.761800, -63.902000, 1000)
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        raio_aviso_m = EXCLUDED.raio_aviso_m;

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES 
    (
        usr_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'admin@supermercado.com', v_senha_hash, timezone('utc', now()),
        '{"provider":"email","providers":["email"]}', '{"nome":"Administrador Geral","papel":"admin"}',
        timezone('utc', now()), timezone('utc', now())
    ),
    (
        usr_operador, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'operador@supermercado.com', v_senha_hash, timezone('utc', now()),
        '{"provider":"email","providers":["email"]}', '{"nome":"Luiz Carlos (Operador)","papel":"operador"}',
        timezone('utc', now()), timezone('utc', now())
    ),
    (
        usr_cliente1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'maria@exemplo.com', v_senha_hash, timezone('utc', now()),
        '{"provider":"email","providers":["email"]}', '{"nome":"Maria da Silva","papel":"cliente"}',
        timezone('utc', now()), timezone('utc', now())
    ),
    (
        usr_cliente2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'joao@exemplo.com', v_senha_hash, timezone('utc', now()),
        '{"provider":"email","providers":["email"]}', '{"nome":"João Santos","papel":"cliente"}',
        timezone('utc', now()), timezone('utc', now())
    )
    ON CONFLICT (id) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data;

    INSERT INTO public.usuarios (id, email, nome, telefone, papel, ativo)
    VALUES 
    (usr_admin, 'admin@supermercado.com', 'Administrador Geral', '(69) 99201-0001', 'admin', true),
    (usr_operador, 'operador@supermercado.com', 'Luiz Carlos (Operador)', '(69) 99201-0002', 'operador', true),
    (usr_cliente1, 'maria@exemplo.com', 'Maria da Silva', '(69) 98402-1111', 'cliente', true),
    (usr_cliente2, 'joao@exemplo.com', 'João Santos', '(69) 98402-2222', 'cliente', true)
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        papel = EXCLUDED.papel,
        ativo = true;

    INSERT INTO public.zonas_entrega (id, bairro, taxa_frete, prazo_estimado_min, ativa) VALUES
    (zona_olaria,    'Olaria',          6.00, 40, true),
    (zona_caiari,    'Caiari',          8.00, 35, true),
    (zona_centro,    'Centro',          5.00, 30, true),
    (zona_embratel,  'Embratel',        7.50, 45, true),
    (zona_cristovao, 'São Cristóvão',   7.00, 40, true),
    (zona_riomadeira,'Rio Madeira',     8.50, 50, true);

    INSERT INTO public.enderecos (usuario_id, zona_id, apelido, logradouro, numero, complemento, cep, padrao) VALUES
    (usr_cliente1, zona_olaria, 'Casa', 'Rua Duque de Caxias', '1240', 'Apto 102', '76801-000', true),
    (usr_cliente1, zona_caiari, 'Trabalho', 'Av. Farquar', '500', 'Sala 4B', '76801-200', false),
    (usr_cliente2, zona_caiari, 'Residência', 'Rua José Bonifácio', '320', NULL, '76801-150', true);

    INSERT INTO public.categorias (id, nome, descricao) VALUES
    (cat_hortifruti, 'Hortifrúti', 'Frutas frescas, verduras e legumes selecionados'),
    (cat_padaria,    'Padaria e Confeitaria', 'Pães fresquinhos, bolos e tortas artesanais'),
    (cat_laticinios, 'Laticínios e Frios', 'Leites, queijos, iogurtes e manteigas'),
    (cat_mercearia,  'Mercearia Básica', 'Arroz, feijão, grãos, massas e enlatados'),
    (cat_carnes,     'Carnes e Aves', 'Cortes bovinos, suínos e aves com padrão de qualidade'),
    (cat_bebidas,    'Bebidas', 'Sucos, refrigerantes, águas e chás'),
    (cat_limpeza,    'Limpeza', 'Produtos de higiene para sua casa e roupas'),
    (cat_higiene,    'Higiene Pessoal', 'Sabonetes, shampoos, cremes dentais e cuidados'),
    (cat_saudavel,   'Dietas e Saudáveis', 'Itens sem glúten, sem lactose e veganos');

    INSERT INTO public.produtos (id, categoria_id, nome, marca, descricao, preco, estoque, sem_lactose, sem_gluten, vegano, ativo) VALUES
    (prod_arroz5kg, cat_mercearia, 'Arroz Branco Tipo 1 5 kg', 'Tio Jorge', 'Arroz de primeira linha, grãos longos e soltinhos.', 28.90, 3, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Arroz Branco Grão Nobre 5 kg', 'Camil', 'Arroz branco tradicional polido para o dia a dia.', 29.50, 40, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Arroz Integral 1 kg', 'Tio João', 'Rico em fibras naturais, 100% integral.', 8.90, 25, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Feijão Carioca 1 kg', 'Kicaldo', 'Feijão carioca novo, caldo espesso e saboroso.', 8.50, 50, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Feijão Preto 1 kg', 'Camil', 'Ideal para feijoada tradicional e consumo diário.', 9.20, 30, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Óleo de Soja 900 ml', 'Soya', 'Óleo vegetal refinado puro.', 6.49, 80, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Açúcar Cristal 2 kg', 'União', 'Açúcar refinado de alta pureza.', 9.80, 45, true, true, true, true),
    (prod_cafe, cat_mercearia, 'Café Torrado e Moído 500g', 'Três Corações', 'Café tradicional de aroma marcante e sabor intenso.', 18.90, 35, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Café Tradicional Almofada 500g', 'Pilão', 'O café forte do Brasil.', 19.20, 30, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Macarrão Espaguete nº 8 500g', 'Barilla', 'Massa de sêmola de trigo grano duro.', 5.90, 40, true, false, true, true),
    (gen_random_uuid(), cat_mercearia, 'Macarrão Parafuso 500g', 'Dona Benta', 'Massa com ovos tradicional.', 4.20, 35, true, false, false, true),
    (gen_random_uuid(), cat_mercearia, 'Molho de Tomate Tradicional 300g', 'Pomarola', 'Molho encorpado sem conservantes.', 3.49, 60, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Farinha de Trigo Tradicional 1 kg', 'Dona Benta', 'Enriquecida com ferro e ácido fólico.', 5.30, 50, true, false, true, true),
    (gen_random_uuid(), cat_mercearia, 'Farinha de Mandioca Torrada 1 kg', 'Yoki', 'Crocante, ideal para farofas.', 6.80, 30, true, true, true, true),
    (prod_azeite, cat_mercearia, 'Azeite de Oliva Extra Virgem 500ml', 'Gallo', 'Acidez máxima 0,5%, sabor frutado.', 38.90, 20, true, true, true, true),
    (gen_random_uuid(), cat_mercearia, 'Sal Refinado 1 kg', 'Cisne', 'Sal de mesa com iodo.', 2.80, 70, true, true, true, true),

    (prod_leite1l, cat_laticinios, 'Leite Integral 1 L', 'Piracanjuba', 'Leite UHT integral pasteurizado de vaca.', 5.99, 60, false, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Leite Semidesnatado UHT 1 L', 'Italac', 'Menor teor de gordura com mesmo teor de cálcio.', 5.89, 50, false, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Leite UHT Zero Lactose 1 L', 'Piracanjuba Nolac', 'Leite bovino tratado enzimaticamente com lactase.', 6.89, 35, true, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Bebida Vegetal de Amêndoas 1 L', 'Silk', '100% vegetal, zero lactose e zero colesterol.', 17.50, 25, true, true, true, true),
    (gen_random_uuid(), cat_laticinios, 'Queijo Mussarela Fatiado 200g', 'President', 'Mussarela suave fatiada fininha.', 9.90, 40, false, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Queijo Prato Lanche Fatiado 200g', 'Sadia', 'Perfeito para lanches quentes e sanduíches.', 10.50, 30, false, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Queijo Minas Frescal 300g', 'Ipanema', 'Queijo artesanal fresco retendo soro de leite.', 13.90, 20, false, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Queijo Mussarela Fatiado Zero Lactose 200g', 'Verde Campo', 'Adicionado de lactase, sabor suave.', 12.90, 25, true, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Queijo Vegano Fatiado à Base de Castanhas 200g', 'Vida Veg', 'Substituto 100% vegetal ao queijo prato.', 19.90, 18, true, true, true, true),
    (gen_random_uuid(), cat_laticinios, 'Requeijão Cremoso Tradicional 200g', 'Catupiry', 'O legítimo requeijão cremoso de leite puro.', 8.90, 35, false, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Requeijão Cremoso Zero Lactose 200g', 'Piracanjuba Nolac', 'Cremosidade pura com lactase.', 9.90, 25, true, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Requeijão Vegano Cremoso de Castanhas 200g', 'Vida Veg', 'Creme vegetal fermentado suave.', 16.90, 15, true, true, true, true),
    (gen_random_uuid(), cat_laticinios, 'Iogurte Natural Integral 170g', 'Nestlé', 'Apenas leite e fermento lácteo.', 3.99, 40, false, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Iogurte Morango Zero Lactose 170g', 'Itambé Nolac', 'Polpa de morango sem lactose.', 4.50, 30, true, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Manteiga de Primeira Qualidade com Sal 200g', 'Aviação', 'Manteiga tradicional de creme de leite fresco.', 12.90, 30, false, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Presunto Cozido Especial Fatiado 200g', 'Sadia', 'Carne suína nobre cozida sem glúten nem lactose.', 8.50, 35, true, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Peito de Peru Defumado Fatiado 200g', 'Sadia', 'Fatias finas e defumadas com baixa gordura.', 11.90, 25, true, true, false, true),
    (gen_random_uuid(), cat_laticinios, 'Salame Italiano Curado Fatiado 100g', 'Seara Gourmet', 'Salame fatiado com vinho e maturação lenta.', 13.50, 20, true, true, false, true),
    (prod_leite_exp, cat_laticinios, 'Leite Condensado 395g', 'Moça Nestlé', 'Leite condensado semidesnatado.', 7.50, 40, false, true, false, true),

    (gen_random_uuid(), cat_padaria, 'Pão de Forma Tradicional 500g', 'Pullman', 'Fatias macias e consistentes para seu café.', 8.50, 30, true, false, true, true),
    (gen_random_uuid(), cat_padaria, 'Pão de Forma 100% Integral 450g', 'Nutrella', 'Grãos selecionados com casca crocante.', 10.90, 20, true, false, true, true),
    (gen_random_uuid(), cat_padaria, 'Pão Francês Tradicional 500g', 'Padaria da Casa', 'Assado na hora, casquinha dourada.', 6.50, 50, true, false, true, true),
    (gen_random_uuid(), cat_padaria, 'Torrada Tradicional 140g', 'Bauducco', 'Crocância incomparável a qualquer hora.', 4.90, 35, true, false, true, true),
    (gen_random_uuid(), cat_padaria, 'Bolo de Cenoura com Gotas 300g', 'Casa de Bolos', 'Massa fofa artesanal.', 11.00, 15, false, false, false, true),

    (gen_random_uuid(), cat_hortifruti, 'Banana Prata 1 kg', 'Produtores de RO', 'Bananas selecionadas e doces da região.', 6.99, 50, true, true, true, true),
    (gen_random_uuid(), cat_hortifruti, 'Maçã Fuji Nacional 1 kg', 'Pomar Sul', 'Maçãs crocantes e suculentas.', 11.90, 40, true, true, true, true),
    (gen_random_uuid(), cat_hortifruti, 'Laranja Pêra Doce 2 kg', 'Fazenda São José', 'Perfeita para fazer suco fresco natural.', 8.90, 45, true, true, true, true),
    (gen_random_uuid(), cat_hortifruti, 'Tomate Longa Vida 1 kg', 'Horta Boa', 'Tomates vermelhos firmes para salada.', 7.80, 35, true, true, true, true),
    (gen_random_uuid(), cat_hortifruti, 'Cebola Nacional 1 kg', 'Horta Boa', 'Cebolas de casca amarela média.', 5.90, 40, true, true, true, true),
    (gen_random_uuid(), cat_hortifruti, 'Batata Lavada Especial 1 kg', 'Serra Grande', 'Ideal para cozer, assar ou fritar.', 6.50, 50, true, true, true, true),
    (gen_random_uuid(), cat_hortifruti, 'Alface Crespa Higienizada un', 'Hidropônica Verde', 'Folhas crocantes cultivadas sem agrotóxicos.', 3.50, 25, true, true, true, true),

    (gen_random_uuid(), cat_carnes, 'Picanha Bovina Resfriada 1 kg', 'Friboi', 'Capa de gordura uniforme, maciez total.', 69.90, 15, true, true, false, true),
    (gen_random_uuid(), cat_carnes, 'Contrafilé Bovino em Bifes 1 kg', 'Maturatta', 'Corte nobre com maciez acentuada.', 48.90, 20, true, true, false, true),
    (gen_random_uuid(), cat_carnes, 'Alcatra Bovina Pedaço 1 kg', 'Friboi', 'Corte versátil e muito magro.', 42.90, 20, true, true, false, true),
    (gen_random_uuid(), cat_carnes, 'Filé de Peito de Frango Congelado 1 kg', 'Sadia', 'Peito sem pele nem osso em bandejas.', 19.90, 35, true, true, false, true),
    (gen_random_uuid(), cat_carnes, 'Coxa e Sobrecoxa de Frango 1 kg', 'Perdigão', 'Saborosa e suculenta para assados.', 12.90, 30, true, true, false, true),
    (gen_random_uuid(), cat_carnes, 'Linguiça Toscana para Churrasco 1 kg', 'Aurora', 'Tempero tradicional suíno.', 21.90, 25, true, true, false, true),

    (prod_guarana, cat_bebidas, 'Refrigerante Guaraná Antarctica 2 L', 'Ambev', 'O autêntico sabor brasileiro com extrato de guaraná.', 9.50, 60, true, true, true, true),
    (gen_random_uuid(), cat_bebidas, 'Refrigerante Coca-Cola Original 2 L', 'Coca-Cola', 'O clássico refrigerante gaseificado.', 10.50, 70, true, true, true, true),
    (gen_random_uuid(), cat_bebidas, 'Suco Integral de Uva 1,5 L', 'Aurora', '100% uva, sem adição de água ou açúcares.', 16.90, 25, true, true, true, true),
    (gen_random_uuid(), cat_bebidas, 'Água Mineral sem Gás 500ml', 'Minalba', 'Água mineral límpida da fonte.', 2.20, 100, true, true, true, true),
    (gen_random_uuid(), cat_bebidas, 'Água de Coco Integral 1 L', 'Sococo', 'Água de coco pura esterilizada.', 9.90, 30, true, true, true, true),

    (prod_deterg, cat_limpeza, 'Detergente Líquido Neutro 500ml', 'Ypê', 'Alto rendimento e poder desengordurante.', 3.20, 80, true, true, true, true),
    (gen_random_uuid(), cat_limpeza, 'Detergente Líquido Maçã 500ml', 'Minuano', 'Fórmula biodegradável suave.', 3.10, 70, true, true, true, true),
    (gen_random_uuid(), cat_limpeza, 'Sabão em Pó Ação Total 1,6 kg', 'Omo', 'Remove as manchas mais difíceis no primeiro ciclo.', 24.90, 40, true, true, true, true),
    (gen_random_uuid(), cat_limpeza, 'Amaciante Concentrado Brisa de Verão 1 L', 'Comfort', '10x mais perfume duradouro.', 18.50, 35, true, true, true, true),
    (gen_random_uuid(), cat_limpeza, 'Água Sanitária Tradicional 2 L', 'Dragão', 'Poder bactericida e alvejante forte.', 7.90, 45, true, true, true, true),
    (gen_random_uuid(), cat_limpeza, 'Desinfetante Lavanda 1 L', 'Pinho Sol', 'Elimina 99,9% das bactérias.', 6.50, 50, true, true, true, true),

    (gen_random_uuid(), cat_higiene, 'Sabonete em Barra Hidratante 85g', 'Dove', 'Com 1/4 de creme hidratante.', 4.50, 80, true, true, false, true),
    (gen_random_uuid(), cat_higiene, 'Creme Dental Proteção Anticáries 90g', 'Colgate', 'Com cálcio e flúor ativo.', 5.20, 75, true, true, true, true),
    (gen_random_uuid(), cat_higiene, 'Shampoo Suave para Todo Tipo de Cabelo 400ml', 'Seda', 'Nutre e fortalece os fios.', 12.90, 35, true, true, true, true),
    (gen_random_uuid(), cat_higiene, 'Desodorante Antitranspirante Roll-On 50ml', 'Rexona', '48 horas de proteção sem manchas.', 11.90, 40, true, true, true, true),
    (gen_random_uuid(), cat_higiene, 'Papel Higiênico Folha Dupla 12 rolos', 'Neve', 'Máxima maciez e absorção.', 23.90, 30, true, true, true, true),

    (gen_random_uuid(), cat_saudavel, 'Pão de Forma Sem Glúten 400g', 'Schar', 'Massa fofa e macia certificada sem glúten.', 15.90, 20, true, true, true, true),
    (gen_random_uuid(), cat_saudavel, 'Macarrão de Arroz Sem Glúten 500g', 'Urbano', 'Massa leve e deliciosa de fácil preparo.', 7.50, 25, true, true, true, true),
    (gen_random_uuid(), cat_saudavel, 'Tofu Orgânico Tradicional 250g', 'Ecobras', '100% vegetal, sem conservantes.', 16.90, 15, true, true, true, true),
    (gen_random_uuid(), cat_saudavel, 'Hambúrguer Vegano Grão de Bico 4 un', 'Fazenda Futuro', 'Sem lactose, sem glúten e rico em proteínas.', 19.90, 18, true, true, true, true),
    (gen_random_uuid(), cat_saudavel, 'Bebida Vegetal de Amêndoas 1 L', 'Silk', 'Zero lactose, enriquecido com cálcio e vitaminas.', 17.50, 20, true, true, true, true),
    (gen_random_uuid(), cat_saudavel, 'Granola Artesanal Zero Açúcar 300g', 'Mãe Terra', 'Castanhas, sementes e flocos integrais.', 14.80, 25, true, false, true, true);

    INSERT INTO public.ofertas (produto_id, preco_promocional, inicio, fim, ativa) VALUES
    (prod_leite1l, 4.99, timezone('utc', now() - INTERVAL '2 days'), timezone('utc', now() + INTERVAL '5 days'), true),
    (prod_arroz5kg, 24.90, timezone('utc', now() - INTERVAL '1 day'), timezone('utc', now() + INTERVAL '7 days'), true),
    (prod_cafe, 15.49, timezone('utc', now() - INTERVAL '3 days'), timezone('utc', now() + INTERVAL '4 days'), true),
    (prod_deterg, 2.49, timezone('utc', now() - INTERVAL '1 day'), timezone('utc', now() + INTERVAL '6 days'), true),
    (prod_azeite, 31.90, timezone('utc', now() - INTERVAL '2 days'), timezone('utc', now() + INTERVAL '3 days'), true),
    (prod_guarana, 7.99, timezone('utc', now() - INTERVAL '2 days'), timezone('utc', now() + INTERVAL '5 days'), true),
    (prod_leite_exp, 5.50, timezone('utc', now() - INTERVAL '7 days'), timezone('utc', now() - INTERVAL '1 day'), true);

    INSERT INTO public.movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, motivo)
    SELECT id, usr_admin, 'entrada', estoque, 'Carga inicial do estoque simulado'
    FROM public.produtos;

    RETURN 'Carga de dados simulados concluída com sucesso! 4 usuários, 9 categorias, 65+ produtos e ofertas ativas.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a carga inicial
SELECT public.restaurar_dados_simulados();
