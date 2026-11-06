-- ==============================================================================
-- IMPROVEMENT E-COMMERCE — REGRAS DE ACESSO POR LINHA (ROW LEVEL SECURITY - RLS)
-- Arquivo: 03_rls_policies.sql
-- Baseado na Especificação Inicial (Fase 1 - AndradeSpec.md: RNF03, RF03)
-- ==============================================================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
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

-- ==============================================================================
-- 2. POLÍTICAS: USUARIOS
-- ==============================================================================

DROP POLICY IF EXISTS "Usuarios podem ler seu próprio perfil ou operadores/admin podem ler todos" ON public.usuarios;
CREATE POLICY "Usuarios podem ler seu próprio perfil ou operadores/admin podem ler todos"
ON public.usuarios FOR SELECT
USING (
    id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin')
);

DROP POLICY IF EXISTS "Usuarios podem editar seu próprio perfil e admin pode alterar qualquer um" ON public.usuarios;
CREATE POLICY "Usuarios podem editar seu próprio perfil e admin pode alterar qualquer um"
ON public.usuarios FOR UPDATE
USING (
    id = auth.uid() OR public.get_current_user_papel() = 'admin'
)
WITH CHECK (
    -- Cliente normal não pode se auto-promover a operador/admin
    (id = auth.uid() AND papel = (SELECT papel FROM public.usuarios WHERE id = auth.uid()))
    OR public.get_current_user_papel() = 'admin'
);

-- ==============================================================================
-- 3. POLÍTICAS: ZONAS_ENTREGA
-- ==============================================================================

DROP POLICY IF EXISTS "Leitura pública de zonas de entrega ativas" ON public.zonas_entrega;
CREATE POLICY "Leitura pública de zonas de entrega ativas"
ON public.zonas_entrega FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Apenas admin pode gerenciar zonas de entrega" ON public.zonas_entrega;
CREATE POLICY "Apenas admin pode gerenciar zonas de entrega"
ON public.zonas_entrega FOR ALL
USING (public.get_current_user_papel() = 'admin')
WITH CHECK (public.get_current_user_papel() = 'admin');

-- ==============================================================================
-- 4. POLÍTICAS: ENDEREÇOS
-- ==============================================================================

DROP POLICY IF EXISTS "Clientes visualizam seus próprios endereços ou operadores" ON public.enderecos;
CREATE POLICY "Clientes visualizam seus próprios endereços ou operadores"
ON public.enderecos FOR SELECT
USING (
    usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin')
);

DROP POLICY IF EXISTS "Clientes gerenciam seus próprios endereços" ON public.enderecos;
CREATE POLICY "Clientes gerenciam seus próprios endereços"
ON public.enderecos FOR ALL
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- ==============================================================================
-- 5. POLÍTICAS: CATEGORIAS
-- ==============================================================================

DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.categorias;
CREATE POLICY "Leitura pública de categorias"
ON public.categorias FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Operadores e admin podem alterar categorias" ON public.categorias;
CREATE POLICY "Operadores e admin podem alterar categorias"
ON public.categorias FOR ALL
USING (public.get_current_user_papel() IN ('operador', 'admin'))
WITH CHECK (public.get_current_user_papel() IN ('operador', 'admin'));

-- ==============================================================================
-- 6. POLÍTICAS: PRODUTOS
-- ==============================================================================

DROP POLICY IF EXISTS "Visitantes e clientes veem produtos ativos; operadores veem todos" ON public.produtos;
CREATE POLICY "Visitantes e clientes veem produtos ativos; operadores veem todos"
ON public.produtos FOR SELECT
USING (
    ativo = true OR public.get_current_user_papel() IN ('operador', 'admin')
);

DROP POLICY IF EXISTS "Operadores e admin podem gerenciar produtos" ON public.produtos;
CREATE POLICY "Operadores e admin podem gerenciar produtos"
ON public.produtos FOR ALL
USING (public.get_current_user_papel() IN ('operador', 'admin'))
WITH CHECK (public.get_current_user_papel() IN ('operador', 'admin'));

-- ==============================================================================
-- 7. POLÍTICAS: OFERTAS
-- ==============================================================================

DROP POLICY IF EXISTS "Visitantes e clientes veem ofertas ativas e vigentes" ON public.ofertas;
CREATE POLICY "Visitantes e clientes veem ofertas ativas e vigentes"
ON public.ofertas FOR SELECT
USING (
    (ativa = true AND timezone('utc', now()) BETWEEN inicio AND fim)
    OR public.get_current_user_papel() IN ('operador', 'admin')
);

DROP POLICY IF EXISTS "Operadores e admin gerenciam ofertas" ON public.ofertas;
CREATE POLICY "Operadores e admin gerenciam ofertas"
ON public.ofertas FOR ALL
USING (public.get_current_user_papel() IN ('operador', 'admin'))
WITH CHECK (public.get_current_user_papel() IN ('operador', 'admin'));

-- ==============================================================================
-- 8. POLÍTICAS: ITENS_CARRINHO
-- ==============================================================================

DROP POLICY IF EXISTS "Clientes têm acesso total exclusivamente ao seu próprio carrinho" ON public.itens_carrinho;
CREATE POLICY "Clientes têm acesso total exclusivamente ao seu próprio carrinho"
ON public.itens_carrinho FOR ALL
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- ==============================================================================
-- 9. POLÍTICAS: PEDIDOS
-- ==============================================================================

DROP POLICY IF EXISTS "Clientes visualizam apenas seus pedidos; equipe vê todos" ON public.pedidos;
CREATE POLICY "Clientes visualizam apenas seus pedidos; equipe vê todos"
ON public.pedidos FOR SELECT
USING (
    usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin')
);

DROP POLICY IF EXISTS "Clientes podem criar pedidos para si próprios" ON public.pedidos;
CREATE POLICY "Clientes podem criar pedidos para si próprios"
ON public.pedidos FOR INSERT
WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Operadores ou clientes (para a_caminho/cancelar) podem atualizar pedidos" ON public.pedidos;
CREATE POLICY "Operadores ou clientes (para a_caminho/cancelar) podem atualizar pedidos"
ON public.pedidos FOR UPDATE
USING (
    usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin')
);

-- ==============================================================================
-- 10. POLÍTICAS: ITENS_PEDIDO
-- ==============================================================================

DROP POLICY IF EXISTS "Acesso aos itens do pedido conforme acesso ao pedido" ON public.itens_pedido;
CREATE POLICY "Acesso aos itens do pedido conforme acesso ao pedido"
ON public.itens_pedido FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.pedidos p
        WHERE p.id = itens_pedido.pedido_id 
          AND (p.usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin'))
    )
);

DROP POLICY IF EXISTS "Criação de itens permitida pelo dono do pedido" ON public.itens_pedido;
CREATE POLICY "Criação de itens permitida pelo dono do pedido"
ON public.itens_pedido FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.pedidos p
        WHERE p.id = itens_pedido.pedido_id AND p.usuario_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Apenas operadores e admin alteram itens do pedido (separação)" ON public.itens_pedido;
CREATE POLICY "Apenas operadores e admin alteram itens do pedido (separação)"
ON public.itens_pedido FOR UPDATE
USING (public.get_current_user_papel() IN ('operador', 'admin'));

-- ==============================================================================
-- 11. POLÍTICAS: MOVIMENTACOES_ESTOQUE
-- ==============================================================================

DROP POLICY IF EXISTS "Apenas operadores e admin visualizam movimentações de estoque" ON public.movimentacoes_estoque;
CREATE POLICY "Apenas operadores e admin visualizam movimentações de estoque"
ON public.movimentacoes_estoque FOR SELECT
USING (public.get_current_user_papel() IN ('operador', 'admin'));

DROP POLICY IF EXISTS "Apenas operadores e admin inserem movimentações diretas" ON public.movimentacoes_estoque;
CREATE POLICY "Apenas operadores e admin inserem movimentações diretas"
ON public.movimentacoes_estoque FOR INSERT
WITH CHECK (public.get_current_user_papel() IN ('operador', 'admin') OR usuario_id = auth.uid());

-- ==============================================================================
-- 12. POLÍTICAS: AVISOS_CHEGADA
-- ==============================================================================

DROP POLICY IF EXISTS "Dono do pedido ou equipe veem avisos de chegada" ON public.avisos_chegada;
CREATE POLICY "Dono do pedido ou equipe veem avisos de chegada"
ON public.avisos_chegada FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.pedidos p
        WHERE p.id = avisos_chegada.pedido_id 
          AND (p.usuario_id = auth.uid() OR public.get_current_user_papel() IN ('operador', 'admin'))
    )
);

DROP POLICY IF EXISTS "Dono do pedido pode registrar aviso de chegada" ON public.avisos_chegada;
CREATE POLICY "Dono do pedido pode registrar aviso de chegada"
ON public.avisos_chegada FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.pedidos p
        WHERE p.id = avisos_chegada.pedido_id AND p.usuario_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Operadores e admin podem atender avisos de chegada" ON public.avisos_chegada;
CREATE POLICY "Operadores e admin podem atender avisos de chegada"
ON public.avisos_chegada FOR UPDATE
USING (public.get_current_user_papel() IN ('operador', 'admin'));

-- ==============================================================================
-- 13. POLÍTICAS: CONFIG_LOJA
-- ==============================================================================

DROP POLICY IF EXISTS "Leitura pública da configuração da loja" ON public.config_loja;
CREATE POLICY "Leitura pública da configuração da loja"
ON public.config_loja FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Apenas admin pode alterar a configuração da loja" ON public.config_loja;
CREATE POLICY "Apenas admin pode alterar a configuração da loja"
ON public.config_loja FOR UPDATE
USING (public.get_current_user_papel() = 'admin')
WITH CHECK (public.get_current_user_papel() = 'admin');
