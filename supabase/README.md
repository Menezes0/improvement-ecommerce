# Banco de Dados — Improvement e-commerce (Supabase / PostgreSQL)

Este diretório contém a modelagem relacional completa, funções de integridade e atomicidade, políticas de segurança por linha (RLS) e o script de carga com dados simulados para a prova de conceito do **Improvement e-commerce** (IFRO - Campus Porto Velho Calama).

---

## 📁 Estrutura dos Arquivos

| Arquivo | Descrição | Requisitos Relacionados |
| :--- | :--- | :--- |
| **[`full_database_setup.sql`](file:///c:/Users/Aluno/Desktop/Nova%20pasta/supabase/full_database_setup.sql)** | **Script unificado (All-in-one).** Contém todo o esquema, funções, RLS e carga simulada. Pronto para rodar no Supabase SQL Editor em uma única execução. | Todos (RF01 a RF25, RNF01 a RNF13) |
| **[`01_schema.sql`](file:///c:/Users/Aluno/Desktop/Nova%20pasta/supabase/01_schema.sql)** | Tabelas relacionais, chaves estrangeiras, restrições `CHECK`, índices de busca e publicação no Supabase Realtime. | RF01–RF06, RF10, RF14, RF18 |
| **[`02_functions_and_triggers.sql`](file:///c:/Users/Aluno/Desktop/Nova%20pasta/supabase/02_functions_and_triggers.sql)** | Procedimentos armazenados: sincronização com `auth.users`, finalização atômica de pedido (`finalizar_pedido`), cancelamento (`cancelar_pedido`), máquina de estados (`atualizar_status_pedido`), ruptura/substituição de itens (`tratar_ruptura_item`) e cálculo geográfico Haversine (`registrar_aviso_aproximacao`). | RF08–RF13, RF15, RF16, RF17, RF21, RF22, RNF07, RNF10 |
| **[`03_rls_policies.sql`](file:///c:/Users/Aluno/Desktop/Nova%20pasta/supabase/03_rls_policies.sql)** | Políticas de isolamento e segurança por linha (Row Level Security - RLS). Garante que clientes acessem apenas seus próprios dados e restringe painéis aos papéis `operador` e `admin`. | RF03, RNF01, RNF03 |
| **[`04_seed_data.sql`](file:///c:/Users/Aluno/Desktop/Nova%20pasta/supabase/04_seed_data.sql)** | Script idempotente com o procedimento `restaurar_dados_simulados()`. Popula 9 categorias, 65+ produtos de supermercado, 6 ofertas vigentes (+ 1 expirada), 6 bairros de Porto Velho e 4 usuários de teste. | RF25, CA33 |

---

## 👥 Credenciais dos Usuários de Demonstração (RF25, CA33)

Todos os usuários foram criados na tabela `auth.users` e no perfil público `public.usuarios` com a senha padrão: **`Senha@123`**.

| Papel | Nome | E-mail | Senha | Função no Sistema |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | Administrador Geral | `admin@supermercado.com` | `Senha@123` | Gerenciar operadores, zonas de frete, configurações da loja e restaurar dados simulados. |
| **Operador** | Luiz Carlos (Operador) | `operador@supermercado.com` | `Senha@123` | Controlar catálogo/estoque, ofertas, separar pedidos, tratar rupturas e atender avisos de chegada. |
| **Cliente 1** | Maria da Silva | `maria@exemplo.com` | `Senha@123` | Navegar, montar carrinho, escolher regra de substituição, comprar com entrega ou retirada e acionar "Estou a caminho". |
| **Cliente 2** | João Santos | `joao@exemplo.com` | `Senha@123` | Cliente adicional para testes de concorrência e múltiplos pedidos simultâneos. |

---

## 🚀 Como Executar no Supabase

### Opção 1: Pelo Dashboard Web do Supabase (Mais Rápido)
1. Acesse o seu projeto no [Supabase Dashboard](https://supabase.com/dashboard).
2. No menu lateral esquerdo, clique no ícone **SQL Editor**.
3. Clique em **+ New Query**.
4. Abra o arquivo [`full_database_setup.sql`](file:///c:/Users/Aluno/Desktop/Nova%20pasta/supabase/full_database_setup.sql), copie todo o seu conteúdo e cole no editor.
5. Clique em **Run** (ou pressione `Ctrl + Enter`).
6. A mensagem `"Carga de dados simulados concluída com sucesso!..."` será exibida.

### Opção 2: Pelo Supabase CLI (Local)
Se estiver utilizando o Supabase localmente com Docker:
```bash
supabase db reset
# ou aplicando via psql:
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/full_database_setup.sql
```

---

## 🔄 Como Restaurar os Dados Simulados a Qualquer Momento (RF25, CA33)

Basta executar o seguinte comando SQL (pelo editor ou chamada RPC no frontend do Administrador):

```sql
SELECT public.restaurar_dados_simulados();
```

Isso limpa os pedidos e movimentações criadas durante os testes e restaura o catálogo para os valores e estoques originais da demonstração.

---

## 🧪 Como Testar as Regras Principais no Banco

### 1. Testar Finalização Atômica de Pedido (RNF10, RF11, CA16)
```sql
-- Simulando Maria da Silva adicionando itens ao carrinho:
INSERT INTO public.itens_carrinho (usuario_id, produto_id, quantidade, regra_substituicao)
VALUES 
    ('c0000000-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000001', 1, 'nao_substituir');

-- Finalizar pedido com retirada:
SELECT public.finalizar_pedido(
    'c0000000-0000-0000-0000-000000000003', -- Maria
    'retirada'
);
```

### 2. Testar Cálculo de Distância Geográfica e Raio (RF15, CA21, CA22)
```sql
-- Teste de cálculo Haversine entre a loja (-8.7618, -63.9020) e um ponto a ~800m (-8.7670, -63.9020):
SELECT public.calcular_distancia_haversine(-8.7670, -63.9020, -8.7618, -63.9020) AS distancia_metros;
```
