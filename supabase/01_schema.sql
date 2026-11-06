-- ==============================================================================
-- IMPROVEMENT E-COMMERCE — ESQUEMA DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- Arquivo: 01_schema.sql
-- Baseado na Especificação Inicial (Fase 1 - AndradeSpec.md)
-- ==============================================================================

-- 1. HABILITAR EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELAS PRINCIPAIS
-- ==============================================================================

-- 2.1 Perfil público de Usuários (vinculado ao auth.users do Supabase)
-- RF01, RF02, RF03, RF23
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

-- 2.2 Zonas de Entrega (Bairros de Porto Velho e taxas de frete)
-- RF04, RF10, RF24
CREATE TABLE IF NOT EXISTS public.zonas_entrega (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bairro TEXT NOT NULL UNIQUE,
    taxa_frete NUMERIC(10,2) NOT NULL CHECK (taxa_frete >= 0),
    prazo_estimado_min INT NOT NULL CHECK (prazo_estimado_min > 0),
    ativa BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.3 Endereços dos Clientes
-- RF04, RF10
CREATE TABLE IF NOT EXISTS public.enderecos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    zona_id UUID NOT NULL REFERENCES public.zonas_entrega(id) ON DELETE RESTRICT,
    apelido TEXT, -- Ex: "Casa", "Trabalho"
    logradouro TEXT NOT NULL,
    numero TEXT NOT NULL,
    complemento TEXT,
    cep TEXT NOT NULL,
    padrao BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.4 Categorias de Produtos
-- RF05, RF18
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.5 Produtos do Catálogo
-- RF05, RF06, RF18, RF19
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
-- RF07, RF20
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

-- 2.7 Itens do Carrinho (Persistente por Usuário)
-- RF08, RF09
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
-- RF10, RF11, RF12, RF13, RF14, RF15, RF21
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
-- RF09, RF11, RF22
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

-- 2.10 Movimentações de Estoque (Auditoria e Rastreabilidade)
-- RF19, RNF13
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'venda', 'cancelamento')),
    quantidade INT NOT NULL, -- Pode ser positivo (entrada, cancelamento) ou negativo (venda, avaria)
    motivo TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.11 Avisos de Chegada (Clique e Retire / Aproximação Geográfica)
-- RF14, RF15, RF16, RF17, RNF07
CREATE TABLE IF NOT EXISTS public.avisos_chegada (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('aproximacao', 'cheguei')),
    distancia_m NUMERIC(10,2) NOT NULL,
    atendido_em TIMESTAMPTZ,
    atendido_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2.12 Configuração Geral da Loja (Linha Única)
-- RF15, RF24
CREATE TABLE IF NOT EXISTS public.config_loja (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nome TEXT NOT NULL DEFAULT 'Supermercado Modelo Porto Velho',
    latitude DOUBLE PRECISION NOT NULL DEFAULT -8.761800,
    longitude DOUBLE PRECISION NOT NULL DEFAULT -63.902000,
    raio_aviso_m INT NOT NULL DEFAULT 1000 CHECK (raio_aviso_m > 0),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- 3. ÍNDICES DE PERFORMANCE (RNF08, RNF09)
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
-- 4. HABILITAÇÃO DO SUPABASE REALTIME (RF06, RF12, RF17, RNF09)
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
