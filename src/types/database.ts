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
  criado_em?: string;
}

export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  marca: string;
  descricao?: string | null;
  preco: number;
  estoque: number;
  sem_lactose: boolean;
  sem_gluten: boolean;
  vegano: boolean;
  ativo: boolean;
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
  preco_promocional: number;
  inicio: string;
  fim: string;
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
  latitude: number;
  longitude: number;
  raio_aviso_m: number;
  atualizado_em?: string;
}
