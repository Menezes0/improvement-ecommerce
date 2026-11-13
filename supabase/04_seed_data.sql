-- ==============================================================================
-- IMPROVEMENT E-COMMERCE — CARGA DE DADOS SIMULADOS E RESTAURAÇÃO (RF25, CA33)
-- Arquivo: 04_seed_data.sql
-- Baseado na Especificação Inicial (Fase 1 - AndradeSpec.md)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.restaurar_dados_simulados()
RETURNS TEXT AS $$
DECLARE
    -- IDs de Categorias
    cat_hortifruti UUID := '11111111-0000-0000-0000-000000000001';
    cat_padaria    UUID := '11111111-0000-0000-0000-000000000002';
    cat_laticinios UUID := '11111111-0000-0000-0000-000000000003';
    cat_mercearia  UUID := '11111111-0000-0000-0000-000000000004';
    cat_carnes     UUID := '11111111-0000-0000-0000-000000000005';
    cat_bebidas    UUID := '11111111-0000-0000-0000-000000000006';
    cat_limpeza    UUID := '11111111-0000-0000-0000-000000000007';
    cat_higiene    UUID := '11111111-0000-0000-0000-000000000008';
    cat_saudavel   UUID := '11111111-0000-0000-0000-000000000009';

    -- IDs de Zonas de Entrega
    zona_olaria   UUID := '22222222-0000-0000-0000-000000000001';
    zona_caiari   UUID := '22222222-0000-0000-0000-000000000002';
    zona_centro   UUID := '22222222-0000-0000-0000-000000000003';
    zona_embratel UUID := '22222222-0000-0000-0000-000000000004';
    zona_cristovao UUID := '22222222-0000-0000-0000-000000000005';
    zona_riomadeira UUID := '22222222-0000-0000-0000-000000000006';

    -- IDs dos 4 Usuários de Demonstração (RF25)
    usr_admin    UUID := 'a0000000-0000-0000-0000-000000000001';
    usr_operador UUID := 'b0000000-0000-0000-0000-000000000002';
    usr_cliente1 UUID := 'c0000000-0000-0000-0000-000000000003';
    usr_cliente2 UUID := 'c0000000-0000-0000-0000-000000000004';

    -- Hash bcrypt para 'Senha@123'
    v_senha_hash TEXT;

    -- IDs de Produtos Específicos para Critérios de Aceite
    prod_arroz5kg UUID := '33333333-0000-0000-0000-000000000001';
    prod_leite1l  UUID := '33333333-0000-0000-0000-000000000002';
    prod_leite_exp UUID := '33333333-0000-0000-0000-000000000003';
    prod_cafe     UUID := '33333333-0000-0000-0000-000000000004';
    prod_deterg   UUID := '33333333-0000-0000-0000-000000000005';
    prod_azeite   UUID := '33333333-0000-0000-0000-000000000006';
    prod_guarana  UUID := '33333333-0000-0000-0000-000000000007';

BEGIN
    -- Gerar hash seguro compatível com auth.users do Supabase
    v_senha_hash := crypt('Senha@123', gen_salt('bf', 10));

    -- ==========================================================================
    -- 1. LIMPAR DADOS EXISTENTES (EXCETO CONFIGURAÇÃO BASE SE DESEJADO)
    -- ==========================================================================
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

    -- ==========================================================================
    -- 2. CONFIGURAÇÃO DA LOJA (PORTO VELHO - RO)
    -- ==========================================================================
    INSERT INTO public.config_loja (id, nome, latitude, longitude, raio_aviso_m)
    VALUES (
        1, 
        'Improvement Supermercados — Loja Porto Velho', 
        -8.761800, 
        -63.902000, 
        1000 -- 1.000 metros (RF15, CA21)
    )
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        raio_aviso_m = EXCLUDED.raio_aviso_m;

    -- ==========================================================================
    -- 3. USUÁRIOS DE DEMONSTRAÇÃO (RF25, CA33)
    -- ==========================================================================
    -- 1 Admin, 1 Operador, 2 Clientes (com senha Senha@123)
    
    -- Criar em auth.users (se ainda não existirem)
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

    -- Garantir inserção em public.usuarios
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

    -- ==========================================================================
    -- 4. ZONAS DE ENTREGA (PORTO VELHO - RO)
    -- ==========================================================================
    INSERT INTO public.zonas_entrega (id, bairro, taxa_frete, prazo_estimado_min, ativa) VALUES
    (zona_olaria,    'Olaria',          6.00, 40, true), -- CA32 (R$ 6,00)
    (zona_caiari,    'Caiari',          8.00, 35, true), -- CA15 (R$ 8,00)
    (zona_centro,    'Centro',          5.00, 30, true),
    (zona_embratel,  'Embratel',        7.50, 45, true),
    (zona_cristovao, 'São Cristóvão',   7.00, 40, true),
    (zona_riomadeira,'Rio Madeira',     8.50, 50, true);

    -- ==========================================================================
    -- 5. ENDEREÇOS SIMULADOS DOS CLIENTES
    -- ==========================================================================
    INSERT INTO public.enderecos (usuario_id, zona_id, apelido, logradouro, numero, complemento, cep, padrao) VALUES
    (usr_cliente1, zona_olaria, 'Casa', 'Rua Duque de Caxias', '1240', 'Apto 102', '76801-000', true),
    (usr_cliente1, zona_caiari, 'Trabalho', 'Av. Farquar', '500', 'Sala 4B', '76801-200', false),
    (usr_cliente2, zona_caiari, 'Residência', 'Rua José Bonifácio', '320', NULL, '76801-150', true);

    -- ==========================================================================
    -- 6. CATEGORIAS DE PRODUTOS (9 CATEGORIAS)
    -- ==========================================================================
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

    -- ==========================================================================
    -- 7. CATÁLOGO COM 65+ PRODUTOS FICTÍCIOS (RF05, RF18, RF25)
    -- ==========================================================================
    INSERT INTO public.produtos (id, categoria_id, nome, marca, descricao, preco, estoque, sem_lactose, sem_gluten, vegano, ativo, imagem_url) VALUES
    -- MERCEARIA (inclui CA08: Arroz 5 kg com estoque 3)
    (prod_arroz5kg, cat_mercearia, 'Arroz Branco Tipo 1 5 kg', 'Tio Jorge', 'Arroz de primeira linha, grãos longos e soltinhos.', 28.90, 3, true, true, true, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Arroz Branco Grão Nobre 5 kg', 'Camil', 'Arroz branco tradicional polido para o dia a dia.', 29.50, 40, true, true, true, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Arroz Integral 1 kg', 'Tio João', 'Rico em fibras naturais, 100% integral.', 8.90, 25, true, true, true, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Feijão Carioca 1 kg', 'Kicaldo', 'Feijão carioca novo, caldo espesso e saboroso.', 8.50, 50, true, true, true, true, 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Feijão Preto 1 kg', 'Camil', 'Ideal para feijoada tradicional e consumo diário.', 9.20, 30, true, true, true, true, 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Óleo de Soja 900 ml', 'Soya', 'Óleo vegetal refinado puro.', 6.49, 80, true, true, true, true, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Açúcar Cristal 2 kg', 'União', 'Açúcar refinado de alta pureza.', 9.80, 45, true, true, true, true, 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80'),
    (prod_cafe, cat_mercearia, 'Café Torrado e Moído 500g', 'Três Corações', 'Café tradicional de aroma marcante e sabor intenso.', 18.90, 35, true, true, true, true, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Café Tradicional Almofada 500g', 'Pilão', 'O café forte do Brasil.', 19.20, 30, true, true, true, true, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Macarrão Espaguete nº 8 500g', 'Barilla', 'Massa de sêmola de trigo grano duro.', 5.90, 40, true, false, true, true, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Macarrão Parafuso 500g', 'Dona Benta', 'Massa com ovos tradicional.', 4.20, 35, true, false, false, true, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Molho de Tomate Tradicional 300g', 'Pomarola', 'Molho encorpado sem conservantes artificiais.', 3.49, 60, true, true, true, true, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Farinha de Trigo Tradicional 1 kg', 'Dona Benta', 'Enriquecida com ferro e ácido fólico.', 5.30, 50, true, false, true, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Farinha de Mandioca Torrada 1 kg', 'Yoki', 'Crocante, ideal para farofas.', 6.80, 30, true, true, true, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80'),
    (prod_azeite, cat_mercearia, 'Azeite de Oliva Extra Virgem 500ml', 'Gallo', 'Acidez máxima 0,5%, sabor frutado.', 38.90, 20, true, true, true, true, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_mercearia, 'Sal Refinado 1 kg', 'Cisne', 'Sal de mesa com iodo.', 2.80, 70, true, true, true, true, 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80'),

    -- LATICÍNIOS E FRIOS (inclui CA10: Leite Integral 1 L)
    (prod_leite1l, cat_laticinios, 'Leite Integral 1 L', 'Piracanjuba', 'Leite UHT integral pasteurizado de vaca.', 5.99, 60, false, true, false, true, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Leite Semidesnatado UHT 1 L', 'Italac', 'Menor teor de gordura com mesmo teor de cálcio.', 5.89, 50, false, true, false, true, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Leite UHT Zero Lactose 1 L', 'Piracanjuba Nolac', 'Leite bovino tratado enzimaticamente com lactase.', 6.89, 35, true, true, false, true, 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Bebida Vegetal de Amêndoas 1 L', 'Silk', '100% vegetal, zero lactose e zero colesterol.', 17.50, 25, true, true, true, true, 'https://images.unsplash.com/photo-1568651769578-f7b57b98ec34?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Queijo Mussarela Fatiado 200g', 'President', 'Mussarela suave fatiada fininha.', 9.90, 40, false, true, false, true, 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Queijo Prato Lanche Fatiado 200g', 'Sadia', 'Perfeito para lanches quentes e sanduíches.', 10.50, 30, false, true, false, true, 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Queijo Minas Frescal 300g', 'Ipanema', 'Queijo artesanal fresco retendo soro de leite.', 13.90, 20, false, true, false, true, 'https://images.unsplash.com/photo-1589881133595-a3c085cb731d?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Queijo Mussarela Fatiado Zero Lactose 200g', 'Verde Campo', 'Adicionado de lactase, sabor suave.', 12.90, 25, true, true, false, true, 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Queijo Vegano Fatiado à Base de Castanhas 200g', 'Vida Veg', 'Substituto 100% vegetal ao queijo prato.', 19.90, 18, true, true, true, true, 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Requeijão Cremoso Tradicional 200g', 'Catupiry', 'O legítimo requeijão cremoso de leite puro.', 8.90, 35, false, true, false, true, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Requeijão Cremoso Zero Lactose 200g', 'Piracanjuba Nolac', 'Cremosidade pura com lactase.', 9.90, 25, true, true, false, true, 'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Requeijão Vegano Cremoso de Castanhas 200g', 'Vida Veg', 'Creme vegetal fermentado suave.', 16.90, 15, true, true, true, true, 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Iogurte Natural Integral 170g', 'Nestlé', 'Apenas leite e fermento lácteo.', 3.99, 40, false, true, false, true, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Iogurte Morango Zero Lactose 170g', 'Itambé Nolac', 'Polpa de morango sem lactose.', 4.50, 30, true, true, false, true, 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Manteiga de Primeira Qualidade com Sal 200g', 'Aviação', 'Manteiga tradicional de creme de leite fresco.', 12.90, 30, false, true, false, true, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Presunto Cozido Especial Fatiado 200g', 'Sadia', 'Carne suína nobre cozida sem glúten nem lactose.', 8.50, 35, true, true, false, true, 'https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Peito de Peru Defumado Fatiado 200g', 'Sadia', 'Fatias finas e defumadas com baixa gordura.', 11.90, 25, true, true, false, true, 'https://images.unsplash.com/photo-1627662237890-a3f2d0111a41?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_laticinios, 'Salame Italiano Curado Fatiado 100g', 'Seara Gourmet', 'Salame fatiado com vinho e maturação lenta.', 13.50, 20, true, true, false, true, 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=500&q=80'),
    (prod_leite_exp, cat_laticinios, 'Leite Condensado 395g', 'Moça Nestlé', 'Leite condensado semidesnatado tradicional.', 7.50, 40, false, true, false, true, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80'),

    -- PADARIA
    (gen_random_uuid(), cat_padaria, 'Pão de Forma Tradicional 500g', 'Pullman', 'Fatias macias e consistentes para seu café.', 8.50, 30, true, false, true, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_padaria, 'Pão de Forma 100% Integral 450g', 'Nutrella', 'Grãos selecionados com casca crocante.', 10.90, 20, true, false, true, true, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_padaria, 'Pão Francês Tradicional 500g', 'Padaria da Casa', 'Assado na hora, casquinha dourada.', 6.50, 50, true, false, true, true, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_padaria, 'Torrada Tradicional 140g', 'Bauducco', 'Crocância incomparável a qualquer hora.', 4.90, 35, true, false, true, true, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_padaria, 'Bolo de Cenoura com Gotas 300g', 'Casa de Bolos', 'Massa fofa artesanal.', 11.00, 15, false, false, false, true, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80'),

    -- HORTIFRÚTI
    (gen_random_uuid(), cat_hortifruti, 'Banana Prata 1 kg', 'Produtores de RO', 'Bananas selecionadas e doces da região.', 6.99, 50, true, true, true, true, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_hortifruti, 'Maçã Fuji Nacional 1 kg', 'Pomar Sul', 'Maçãs crocantes e suculentas.', 11.90, 40, true, true, true, true, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_hortifruti, 'Laranja Pêra Doce 2 kg', 'Fazenda São José', 'Perfeita para fazer suco fresco natural.', 8.90, 45, true, true, true, true, 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_hortifruti, 'Tomate Longa Vida 1 kg', 'Horta Boa', 'Tomates vermelhos firmes para salada.', 7.80, 35, true, true, true, true, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_hortifruti, 'Cebola Nacional 1 kg', 'Horta Boa', 'Cebolas de casca amarela média.', 5.90, 40, true, true, true, true, 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_hortifruti, 'Batata Lavada Especial 1 kg', 'Serra Grande', 'Ideal para cozer, assar ou fritar.', 6.50, 50, true, true, true, true, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_hortifruti, 'Alface Crespa Higienizada un', 'Hidropônica Verde', 'Folhas crocantes cultivadas sem agrotóxicos.', 3.50, 25, true, true, true, true, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80'),

    -- CARNES E AVES (Incluindo opções Vegana, Sem Lactose e Sem Glúten)
    (gen_random_uuid(), cat_carnes, 'Picanha Bovina Resfriada Peça 1 kg', 'Friboi 1953', 'Capa de gordura uniforme, maciez total.', 69.90, 15, true, true, false, true, 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_carnes, 'Contrafilé Bovino em Bifes 1 kg', 'Maturatta', 'Corte nobre com maciez acentuada.', 48.90, 20, true, true, false, true, 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_carnes, 'Alcatra Bovina Pedaço 1 kg', 'Friboi', 'Corte versátil e muito magro.', 42.90, 20, true, true, false, true, 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_carnes, 'Filé de Peito de Frango Congelado 1 kg', 'Sadia', 'Peito sem pele nem osso em bandejas.', 19.90, 35, true, true, false, true, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_carnes, 'Coxa e Sobrecoxa de Frango 1 kg', 'Perdigão', 'Saborosa e suculenta para assados.', 12.90, 30, true, true, false, true, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_carnes, 'Linguiça Toscana para Churrasco 1 kg', 'Aurora', 'Tempero tradicional suíno.', 21.90, 25, true, true, false, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_carnes, 'Hambúrguer 100% Vegetal Plant-Based 4 un (230g)', 'Fazenda Futuro', '100% à base de plantas, suculência e sabor da carne.', 21.90, 25, true, true, true, true, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_carnes, 'Carne Moída 100% Vegetal Moído Incrível 270g', 'Incrível Seara', 'Carne moída vegana sem glúten nem lactose.', 17.90, 20, true, true, true, true, 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=500&q=80'),

    -- BEBIDAS
    (prod_guarana, cat_bebidas, 'Refrigerante Guaraná Antarctica 2 L', 'Ambev', 'O autêntico sabor brasileiro com extrato de guaraná.', 9.50, 60, true, true, true, true, 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_bebidas, 'Refrigerante Coca-Cola Original 2 L', 'Coca-Cola', 'O clássico refrigerante gaseificado.', 10.50, 70, true, true, true, true, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_bebidas, 'Suco Integral de Uva 1,5 L', 'Aurora', '100% uva, sem adição de água ou açúcares.', 16.90, 25, true, true, true, true, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_bebidas, 'Água Mineral sem Gás 500ml', 'Minalba', 'Água mineral límpida da fonte.', 2.20, 100, true, true, true, true, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_bebidas, 'Água de Coco Integral 1 L', 'Sococo', 'Água de coco pura esterilizada.', 9.90, 30, true, true, true, true, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80'),

    -- LIMPEZA
    (prod_deterg, cat_limpeza, 'Detergente Líquido Neutro 500ml', 'Ypê', 'Alto rendimento e poder desengordurante.', 3.20, 80, true, true, true, true, 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_limpeza, 'Detergente Líquido Maçã 500ml', 'Minuano', 'Fórmula biodegradável suave.', 3.10, 70, true, true, true, true, 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_limpeza, 'Sabão em Pó Ação Total 1,6 kg', 'Omo', 'Remove as manchas mais difíceis no primeiro ciclo.', 24.90, 40, true, true, true, true, 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_limpeza, 'Amaciante Concentrado Brisa de Verão 1 L', 'Comfort', '10x mais perfume duradouro.', 18.50, 35, true, true, true, true, 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_limpeza, 'Água Sanitária Tradicional 2 L', 'Dragão', 'Poder bactericida e alvejante forte.', 7.90, 45, true, true, true, true, 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_limpeza, 'Desinfetante Lavanda 1 L', 'Pinho Sol', 'Elimina 99,9% das bactérias.', 6.50, 50, true, true, true, true, 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=500&q=80'),

    -- HIGIENE PESSOAL (Incluindo opções Vegana, Sem Lactose e Sem Glúten)
    (gen_random_uuid(), cat_higiene, 'Sabonete Puro Vegetal Esfoliante 90g', 'Natura Tododia', '100% vegetal com óleo de sementes.', 5.90, 60, true, true, true, true, 'https://images.unsplash.com/photo-1607006311600-314539b78295?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_higiene, 'Shampoo Nutritivo Vegano e Hipoalergênico 350ml', 'Lola Cosmetics', 'Botânico sem sulfatos nem testes em animais.', 22.90, 30, true, true, true, true, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_higiene, 'Creme Dental Vegano Natural sem Flúor 90g', 'Boni Natural', 'Livre de glúten e parabenos com extrato de melaleuca.', 11.50, 45, true, true, true, true, 'https://images.unsplash.com/photo-1559591937-e10b1a03e1ef?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_higiene, 'Desodorante Roll-On Vegano Cristal 50ml', 'Alva Naturkosmetik', 'Sem alumínio e sem álcool, hipoalergênico.', 16.90, 35, true, true, true, true, 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_higiene, 'Sabonete em Barra Hidratante com Manteiga e Leite 90g', 'Dove Nutrição', 'Enriquecido com leite integral e aveia.', 4.80, 70, false, false, false, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_higiene, 'Creme Dental Proteção Anticáries 90g', 'Colgate Total 12', 'Com cálcio e flúor ativo.', 5.20, 75, true, true, false, true, 'https://images.unsplash.com/photo-1559591937-e10b1a03e1ef?auto=format&fit=crop&w=500&q=80'),

    -- DIETAS E SAUDÁVEIS (ESPECIAIS)
    (gen_random_uuid(), cat_saudavel, 'Pão de Forma Sem Glúten 400g', 'Schar', 'Massa fofa e macia certificada sem glúten.', 15.90, 20, true, true, true, true, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_saudavel, 'Macarrão de Arroz Sem Glúten 500g', 'Urbano', 'Massa leve e deliciosa de fácil preparo.', 7.50, 25, true, true, true, true, 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_saudavel, 'Tofu Orgânico Tradicional 250g', 'Ecobras', '100% vegetal, sem conservantes.', 16.90, 15, true, true, true, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_saudavel, 'Hambúrguer Vegano Grão de Bico 4 un', 'Fazenda Futuro', 'Sem lactose, sem glúten e rico em proteínas.', 19.90, 18, true, true, true, true, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_saudavel, 'Bebida Vegetal de Amêndoas 1 L', 'Silk', 'Zero lactose, enriquecido com cálcio e vitaminas.', 17.50, 20, true, true, true, true, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80'),
    (gen_random_uuid(), cat_saudavel, 'Granola Artesanal Zero Açúcar 300g', 'Mãe Terra', 'Castanhas, sementes e flocos integrais.', 14.80, 25, true, false, true, true, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80');

    -- ==========================================================================
    -- 8. MURAL DE OFERTAS VIGENTES E EXPIRADAS (RF07, RF20, CA10, CA11, RF25)
    -- ==========================================================================
    -- Ao menos 5 ofertas vigentes + 1 oferta expirada ontem para validar CA11
    INSERT INTO public.ofertas (produto_id, preco_promocional, inicio, fim, ativa) VALUES
    -- CA10: Leite Integral 1 L de R$ 5,99 por R$ 4,99 vigente
    (prod_leite1l, 4.99, timezone('utc', now() - INTERVAL '2 days'), timezone('utc', now() + INTERVAL '5 days'), true),
    
    -- Oferta 2: Arroz 5 kg por R$ 24,90
    (prod_arroz5kg, 24.90, timezone('utc', now() - INTERVAL '1 day'), timezone('utc', now() + INTERVAL '7 days'), true),

    -- Oferta 3: Café Três Corações por R$ 15,49
    (prod_cafe, 15.49, timezone('utc', now() - INTERVAL '3 days'), timezone('utc', now() + INTERVAL '4 days'), true),

    -- Oferta 4: Detergente Ypê por R$ 2,49
    (prod_deterg, 2.49, timezone('utc', now() - INTERVAL '1 day'), timezone('utc', now() + INTERVAL '6 days'), true),

    -- Oferta 5: Azeite Gallo por R$ 31,90
    (prod_azeite, 31.90, timezone('utc', now() - INTERVAL '2 days'), timezone('utc', now() + INTERVAL '3 days'), true),

    -- Oferta 6: Guaraná Antarctica por R$ 7,99
    (prod_guarana, 7.99, timezone('utc', now() - INTERVAL '2 days'), timezone('utc', now() + INTERVAL '5 days'), true),

    -- CA11: Oferta ENCERRADA ONTEM (Não deve aparecer no mural vigente)
    (prod_leite_exp, 5.50, timezone('utc', now() - INTERVAL '7 days'), timezone('utc', now() - INTERVAL '1 day'), true);

    -- ==========================================================================
    -- 9. LOG INICIAL DE MOVIMENTAÇÕES DE ESTOQUE (RNF13)
    -- ==========================================================================
    INSERT INTO public.movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, motivo)
    SELECT id, usr_admin, 'entrada', estoque, 'Carga inicial do estoque simulado'
    FROM public.produtos;

    RETURN 'Carga de dados simulados concluída com sucesso! 4 usuários, 9 categorias, 65+ produtos e ofertas ativas.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar a carga inicial imediatamente
SELECT public.restaurar_dados_simulados();
