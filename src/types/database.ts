// ==============================================================================
// IMPROVEMENT E-COMMERCE — TIPOS DO BANCO DE DADOS E NEGÓCIO
// Baseado no DER e nos Requisitos Funcionais (AndradeSpec.md)
// ==============================================================================

export type PapelUsuario = 'cliente' | 'operador' | 'admin' | 'visitante';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  telefone?: string | null;
  papel: PapelUsuario;
  ativo: boolean;
  criado_em: string;
}

export interface ZonaEntrega {
  id: string;
  bairro: string;
  taxa_frete: number;
  prazo_estimado_min: number;
  ativa: boolean;
  criado_em?: string;
}

export interface Endereco {
  id: string;
  usuario_id: string;
  zona_id: string;
  apelido?: string | null;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  cep: string;
  padrao: boolean;
  bairro?: string; // vindo do join com zonas_entrega
  taxa_frete?: number;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem?: number;
  icone_url?: string | null;
  ativa: boolean;
  aliquota_icms: number; // 7, 12, 18 ou 25 (%)
  criado_em?: string;
}

export type UnidadeMedida = 'UN' | 'KG' | 'L' | 'PCT' | 'CX';

export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  marca: string;
  descricao?: string | null;
  sku?: string;
  unidade?: UnidadeMedida;
  preco: number;             // Preço de venda
  preco_custo?: number;      // Preço de custo (obrigatório no cadastro/edição para margem e compras)
  margem_lucro_percentual?: number;
  estoque: number;
  estoque_minimo?: number;   // Limite para alerta de estoque baixo (padrão: 10)
  ncm?: string;              // Código fiscal NCM (8 dígitos)
  aliquota_icms_customizada?: number | null;
  sem_lactose: boolean;
  sem_gluten: boolean;
  vegano: boolean;
  ativo: boolean;            // Soft delete (false = inativo)
  imagem_url?: string | null;
  criado_em?: string;
  atualizado_em?: string;
  // Campos calculados ou de junção
  preco_promocional?: number | null;
  oferta_ativa?: boolean;
  categoria_nome?: string;
}

export interface Oferta {
  id: string;
  produto_id: string;
  tipo_desconto?: 'percentual' | 'fixo';
  valor_desconto?: number;
  preco_original?: number;
  preco_promocional: number;
  inicio: string;
  fim: string;
  destaque_mural?: boolean;
  ativa: boolean;
  criado_em?: string;
  // Join com produto
  produto?: Produto;
}

export type RegraSubstituicao = 'troca_marca' | 'nao_substituir';

export interface ItemCarrinho {
  usuario_id: string;
  produto_id: string;
  quantidade: number;
  regra_substituicao: RegraSubstituicao;
  adicionado_em?: string;
  produto?: Produto;
}

export type TipoPedido = 'entrega' | 'retirada';

export type StatusPedido =
  | 'recebido'
  | 'em_separacao'
  | 'pronto'
  | 'saiu_para_entrega'
  | 'concluido'
  | 'cancelado';

export interface Pedido {
  id: string;
  usuario_id: string;
  tipo: TipoPedido;
  status: StatusPedido;
  endereco_id?: string | null;
  subtotal: number;
  frete: number;
  total: number;
  a_caminho: boolean;
  ultima_distancia_m?: number | null;
  criado_em: string;
  atualizado_em: string;
  // Joins
  cliente_nome?: string;
  cliente_email?: string;
  endereco?: Endereco;
  itens?: ItemPedido[];
}

export type SituacaoItemPedido = 'pendente' | 'separado' | 'substituido' | 'cortado';

export interface ItemPedido {
  id: string;
  pedido_id: string;
  produto_id: string;
  produto_substituto_id?: string | null;
  quantidade: number;
  preco_unitario: number;
  regra_substituicao: RegraSubstituicao;
  situacao: SituacaoItemPedido;
  criado_em?: string;
  // Joins
  produto?: Produto;
  produto_substituto?: Produto;
}

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste' | 'venda' | 'cancelamento';

export interface MovimentacaoEstoque {
  id: string;
  produto_id: string;
  usuario_id: string;
  pedido_id?: string | null;
  tipo: TipoMovimentacao;
  quantidade: number;
  motivo?: string | null;
  criado_em: string;
  produto_nome?: string;
}

export type TipoAviso = 'aproximacao' | 'cheguei';

export interface AvisoChegada {
  id: string;
  pedido_id: string;
  tipo: TipoAviso;
  distancia_m: number;
  atendido_em?: string | null;
  atendido_por?: string | null;
  criado_em: string;
  // Joins
  pedido?: Pedido;
  cliente_nome?: string;
}

export interface ConfigLoja {
  id: number;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  horario_funcionamento?: string;
  latitude: number;
  longitude: number;
  raio_aviso_m: number;
  atualizado_em?: string;
}

// ==========================================
// MÓDULO DE COMPRAS & FORNECEDORES
// ==========================================

export interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string;
  telefone: string;
  email: string;
  cidade: string;
  uf: string;
  prazo_pagamento_padrao_dias: number;
  ativo: boolean;
  criado_em?: string;
}

export type StatusPedidoCompra = 
  | 'pendente'          // Criado, aguardando envio do fornecedor
  | 'aprovado'          // Confirmado
  | 'recebido_parcial'  // Remessa chegou, saldo pendente > 0
  | 'recebido'          // Totalmente recebido (saldo = 0)
  | 'cancelado';

export interface ItemPedidoCompra {
  id: string;
  pedido_compra_id: string;
  produto_id: string;
  produto_nome: string;
  sku: string;
  unidade: string;
  preco_custo_unitario: number;
  quantidade_pedida: number;             // Somente leitura na conferência
  quantidade_recebida_acumulada: number; // Somatório de recebidos aceitos
  quantidade_avaria_acumulada: number;   // Somatório de avarias
  quantidade_saldo_restante: number;     // pedida - recebida_acumulada
}

export interface RegistroRecebimentoMercadoria {
  id: string;
  pedido_compra_id: string;
  item_pedido_compra_id: string;
  data_recebimento: string;
  quantidade_recebida: number;
  quantidade_avaria: number;
  quantidade_liquida_estoque: number;    // recebida - avaria
  motivo_divergencia?: string | null;
  observacoes?: string | null;
  conferente_usuario_id: string;
  conferente_nome: string;
}

export interface PedidoCompra {
  id: string;
  numero_sequencial: number;
  fornecedor_id: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  status: StatusPedidoCompra;
  valor_total_previsto: number;
  valor_total_realizado: number;
  data_emissao: string;
  previsao_entrega: string;
  gerar_conta_pagar: boolean;
  conta_pagar_id?: string | null;
  data_vencimento_acordada?: string;
  observacoes?: string | null;
  criado_por_usuario_id: string;
  criado_em: string;
  atualizado_em: string;
  itens: ItemPedidoCompra[];
}

// ==========================================
// MÓDULO FINANCEIRO & CONTAS A PAGAR
// ==========================================

export type CategoriaDespesa = 
  | 'compra_mercadorias' 
  | 'luz' 
  | 'agua' 
  | 'aluguel' 
  | 'salarios' 
  | 'internet' 
  | 'manutencao' 
  | 'impostos' 
  | 'marketing' 
  | 'outras';

export type StatusContaPagar = 'pendente' | 'paga' | 'vencida' | 'cancelada';

export interface ContaPagar {
  id: string;
  descricao: string;
  categoria: CategoriaDespesa;
  fornecedor_id?: string | null;
  fornecedor_nome?: string | null;
  pedido_compra_id?: string | null;
  valor_original: number;
  valor_ajustado: number;
  valor_pago?: number | null;
  data_emissao: string;               // YYYY-MM-DD
  data_vencimento: string;            // YYYY-MM-DD
  data_pagamento?: string | null;     // YYYY-MM-DD
  forma_pagamento?: 'pix' | 'boleto' | 'transferencia' | 'cartao_corporativo' | 'dinheiro' | null;
  status: StatusContaPagar;
  observacoes?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export type TipoLancamentoFinanceiro = 'receita' | 'despesa';

export interface LancamentoFinanceiro {
  id: string;
  tipo: TipoLancamentoFinanceiro;
  descricao: string;
  categoria: string;                  // 'Venda de Mercadorias', 'Luz', 'Água', etc.
  valor: number;
  data: string;                       // YYYY-MM-DD
  pedido_id?: string | null;
  conta_pagar_id?: string | null;
  forma_pagamento?: string | null;
  criado_em: string;
}

// ==========================================
// NOTA FISCAL (NF-e / NFC-e SIMULADA)
// ==========================================

export interface ItemNotaFiscal {
  id: string;
  nota_fiscal_id: string;
  numero_item: number;
  produto_id: string;
  sku: string;
  descricao: string;
  ncm: string;
  cfop: string;                       // "5.102"
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total_bruto: number;
  categoria_nome: string;
  aliquota_icms: number;              // 7, 12, 18, 25 (%)
  base_calculo_icms: number;
  valor_icms: number;
  aliquota_pis: number;               // 1.65%
  valor_pis: number;
  aliquota_cofins: number;            // 7.60%
  valor_cofins: number;
}

export interface NotaFiscal {
  id: string;
  pedido_id: string;
  numero_nfe: number;                 // Sequencial (ex: 1042)
  serie: number;                      // 1
  chave_acesso: string;               // 44 dígitos oficiais SEFAZ
  natureza_operacao: string;          // "Venda de mercadoria"
  cfop_padrao: string;                // "5.102"
  data_emissao: string;
  status: 'autorizada' | 'cancelada';
  
  // Emitente
  emitente_razao_social: string;
  emitente_cnpj: string;
  emitente_ie: string;
  emitente_endereco: string;
  
  // Destinatário
  destinatario_nome: string;
  destinatario_cpf: string;
  destinatario_endereco: string;
  
  // Valores Totais
  valor_produtos: number;
  valor_frete: number;
  valor_desconto: number;
  valor_total_nota: number;
  base_calculo_icms: number;
  valor_total_icms: number;
  aliquota_pis: number;
  valor_pis: number;
  aliquota_cofins: number;
  valor_cofins: number;
  valor_tributos_aproximados: number; // 27.50% (Lei 12.741/12)
  
  forma_pagamento: string;
  qr_code_conteudo: string;
  observacao_legal: string;
  itens: ItemNotaFiscal[];
  criado_em: string;
}

// ==========================================
// AUDITORIA E LOGS DO SISTEMA
// ==========================================

export type TipoAcaoAuditoria = 
  | 'estoque' 
  | 'preco' 
  | 'pedido' 
  | 'recebimento_compra' 
  | 'financeiro' 
  | 'cliente' 
  | 'operador' 
  | 'oferta' 
  | 'sistema';

export interface LogAuditoria {
  id: string;
  tipo: TipoAcaoAuditoria;
  acao: string;                       // "Ajuste de Estoque", "Alteração de Preço", "Baixa de Conta a Pagar"
  descricao: string;
  usuario_id: string;
  usuario_nome: string;
  detalhes?: {
    antes?: unknown;
    depois?: unknown;
    motivo?: string;
  };
  criado_em: string;
}
