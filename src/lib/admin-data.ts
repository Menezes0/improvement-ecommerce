// ==============================================================================
// IMPROVEMENT E-COMMERCE — SISTEMA ADMINISTRATIVO, COMPRAS, FINANCEIRO E FISCAL
// Projeto Acadêmico IFRO Campus Porto Velho Calama
// ==============================================================================

import {
  Produto,
  Categoria,
  Fornecedor,
  PedidoCompra,
  ItemPedidoCompra,
  RegistroRecebimentoMercadoria,
  ContaPagar,
  LancamentoFinanceiro,
  NotaFiscal,
  ItemNotaFiscal,
  LogAuditoria,
  Pedido,
  ConfigLoja,
} from '@/types/database';
import { CATEGORIAS_DEMO, PRODUTOS_DEMO, CONFIG_LOJA_DEMO, USUARIOS_DEMO } from './demo-data';

// ==========================================
// FORNECEDORES INICIAIS
// ==========================================
export const FORNECEDORES_DEMO: Fornecedor[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    razao_social: 'Distribuidora Rondônia de Alimentos Ltda',
    nome_fantasia: 'Rondônia Alimentos',
    cnpj: '04.123.456/0001-88',
    inscricao_estadual: '0000001234567-8',
    telefone: '(69) 3224-5500',
    email: 'vendas@rondoniaalimentos.com.br',
    cidade: 'Porto Velho',
    uf: 'RO',
    prazo_pagamento_padrao_dias: 28,
    ativo: true,
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    razao_social: 'Laticínios Três Marias Indústria & Comércio',
    nome_fantasia: 'Laticínios Três Marias',
    cnpj: '07.890.123/0001-44',
    inscricao_estadual: '0000002345678-9',
    telefone: '(69) 3421-3300',
    email: 'pedidos@laticiniostresmarias.com.br',
    cidade: 'Ji-Paraná',
    uf: 'RO',
    prazo_pagamento_padrao_dias: 21,
    ativo: true,
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    razao_social: 'Moinho Guaporé Farinhas e Grãos S/A',
    nome_fantasia: 'Moinho Guaporé',
    cnpj: '14.567.890/0001-12',
    inscricao_estadual: '0000003456789-0',
    telefone: '(69) 3322-1100',
    email: 'comercial@moinhoguapore.com.br',
    cidade: 'Vilhena',
    uf: 'RO',
    prazo_pagamento_padrao_dias: 30,
    ativo: true,
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    razao_social: 'Norte Bebidas e Produtos de Limpeza Ltda',
    nome_fantasia: 'Norte Bebidas & Higiene',
    cnpj: '22.334.556/0001-99',
    inscricao_estadual: '0000004567890-1',
    telefone: '(69) 3219-8800',
    email: 'atendimento@nortebebidasro.com.br',
    cidade: 'Porto Velho',
    uf: 'RO',
    prazo_pagamento_padrao_dias: 15,
    ativo: true,
  },
];

// ==========================================
// TABELA DE NCMs PADRÃO POR CATEGORIA
// ==========================================
export const NCM_PADRAO_CATEGORIAS: Record<string, string> = {
  'Hortifrúti': '0709.99.90',
  'Padaria e Confeitaria': '1905.90.90',
  'Laticínios e Frios': '0406.10.10',
  'Mercearia Básica': '1006.30.21',
  'Carnes e Aves': '0201.30.00',
  'Bebidas': '2202.10.00',
  'Limpeza': '3402.20.00',
  'Higiene Pessoal': '3306.10.00',
  'Dietas e Saudáveis': '2106.90.90',
};

// ==========================================
// NORMALIZAÇÃO DE PRODUTOS
// ==========================================
export function normalizarProduto(raw: Produto, index: number = 0): Produto {
  const precoVenda = Number(raw.preco) || 5.0;
  // Custo praticado entre 65% e 72% do preço de venda para margem comercial saudável
  const precoCustoCalculado = Number((raw.preco_custo || precoVenda * 0.68).toFixed(2));
  const margemPercentual = Number((((precoVenda - precoCustoCalculado) / precoVenda) * 100).toFixed(1));
  const skuPadrao = raw.sku || `SKU-${String(1000 + index).padStart(5, '0')}`;
  const unidadePadrao = raw.unidade || (raw.nome.toLowerCase().includes(' kg') ? 'KG' : raw.nome.toLowerCase().includes(' l') ? 'L' : 'UN');
  const ncmPadrao = raw.ncm || NCM_PADRAO_CATEGORIAS[raw.categoria_nome || ''] || '2106.90.90';

  return {
    ...raw,
    preco: precoVenda,
    preco_custo: precoCustoCalculado,
    margem_lucro_percentual: margemPercentual,
    sku: skuPadrao,
    unidade: unidadePadrao,
    ncm: ncmPadrao,
    estoque: raw.estoque ?? 20,
    estoque_minimo: raw.estoque_minimo ?? 10,
    ativo: raw.ativo ?? true,
    sem_lactose: Boolean(raw.sem_lactose),
    sem_gluten: Boolean(raw.sem_gluten),
    vegano: Boolean(raw.vegano),
  };
}

// ==========================================
// GERAÇÃO DE CHAVE DE ACESSO E DV (MÓDULO 11 SEFAZ)
// ==========================================
export function calcularDigitoVerificadorModulo11(chave43: string): number {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  let pesoIdx = 0;

  for (let i = chave43.length - 1; i >= 0; i--) {
    const digito = parseInt(chave43[i], 10) || 0;
    soma += digito * pesos[pesoIdx];
    pesoIdx = (pesoIdx + 1) % pesos.length;
  }

  const resto = soma % 11;
  const dv = 11 - resto;
  if (dv === 10 || dv === 11) return 0;
  return dv;
}

export function gerarChaveAcessoNFe(numeroNfe: number, dataIso: string = new Date().toISOString()): {
  chaveCompleta: string;
  chaveFormatada: string;
} {
  const cUF = '11'; // Rondônia
  const d = new Date(dataIso);
  const aa = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aamm = `${aa}${mm}`;
  const cnpj = '12345678000190'; // Improvement Supermercados
  const mod = '55'; // NF-e (ou 65 NFC-e)
  const serie = '001';
  const nNF = String(numeroNfe).padStart(9, '0');
  const tpEmis = '1'; // Emissão normal
  // Código numérico aleatório determinístico baseado no número
  const cNF = String(Math.abs((numeroNfe * 739391) % 100000000)).padStart(8, '7');

  const chave43 = `${cUF}${aamm}${cnpj}${mod}${serie}${nNF}${tpEmis}${cNF}`;
  const dv = calcularDigitoVerificadorModulo11(chave43);
  const chaveCompleta = `${chave43}${dv}`;

  // Formatação em blocos de 4 dígitos
  const chaveFormatada = chaveCompleta.replace(/(\d{4})/g, '$1 ').trim();

  return { chaveCompleta, chaveFormatada };
}

// ==========================================
// CÁLCULO DE ALÍQUOTAS DE ICMS CONFORME ESPECIFICAÇÃO
// ==========================================
export function obterAliquotaIcmsPorCategoria(categoriaNome: string): number {
  switch (categoriaNome) {
    case 'Hortifrúti':
    case 'Mercearia Básica':
      return 7;
    case 'Padaria e Confeitaria':
    case 'Laticínios e Frios':
    case 'Carnes e Aves':
    case 'Dietas e Saudáveis':
      return 12;
    case 'Bebidas':
    case 'Limpeza':
    case 'Higiene Pessoal':
    case 'Outros':
      return 18;
    case 'Bebidas Alcoólicas':
      return 25;
    default:
      return 18;
  }
}

// ==========================================
// GERAÇÃO DE NOTA FISCAL A PARTIR DE UM PEDIDO
// ==========================================
export function gerarNotaFiscalDePedido(
  pedido: Pedido,
  produtosCatalogo: Produto[],
  numeroNfeSequencial: number
): NotaFiscal {
  const agora = new Date().toISOString();
  const { chaveCompleta } = gerarChaveAcessoNFe(numeroNfeSequencial, agora);

  const itensNota: ItemNotaFiscal[] = (pedido.itens || []).map((item, idx) => {
    const prod = produtosCatalogo.find((p) => p.id === item.produto_id) || item.produto;
    const catNome = prod?.categoria_nome || 'Mercearia Básica';
    const aliquotaIcms = prod?.aliquota_icms_customizada ?? obterAliquotaIcmsPorCategoria(catNome);
    const qtd = Number(item.quantidade) || 1;
    const vlrUnit = Number(item.preco_unitario) || Number(prod?.preco) || 5.0;
    const totalBruto = Number((qtd * vlrUnit).toFixed(2));
    const baseIcms = totalBruto;
    const vlrIcms = Number((baseIcms * (aliquotaIcms / 100)).toFixed(2));
    const vlrPis = Number((baseIcms * 0.0165).toFixed(2));
    const vlrCofins = Number((baseIcms * 0.0760).toFixed(2));

    return {
      id: `inf-${pedido.id}-${idx + 1}`,
      nota_fiscal_id: `nf-${pedido.id}`,
      numero_item: idx + 1,
      produto_id: item.produto_id,
      sku: prod?.sku || `SKU-${idx + 100}`,
      descricao: prod?.nome || 'Item do Pedido',
      ncm: prod?.ncm || NCM_PADRAO_CATEGORIAS[catNome] || '2106.90.90',
      cfop: '5.102',
      unidade: prod?.unidade || 'UN',
      quantidade: qtd,
      valor_unitario: vlrUnit,
      valor_total_bruto: totalBruto,
      categoria_nome: catNome,
      aliquota_icms: aliquotaIcms,
      base_calculo_icms: baseIcms,
      valor_icms: vlrIcms,
      aliquota_pis: 1.65,
      valor_pis: vlrPis,
      aliquota_cofins: 7.60,
      valor_cofins: vlrCofins,
    };
  });

  const totalProdutos = itensNota.reduce((acc, it) => acc + it.valor_total_bruto, 0);
  const totalFrete = Number(pedido.frete) || 0;
  const totalDesconto = 0;
  const valorTotalNota = Number((totalProdutos + totalFrete - totalDesconto).toFixed(2));
  const baseCalculoIcms = totalProdutos;
  const valorTotalIcms = Number(itensNota.reduce((acc, it) => acc + it.valor_icms, 0).toFixed(2));
  const valorPis = Number((baseCalculoIcms * 0.0165).toFixed(2));
  const valorCofins = Number((baseCalculoIcms * 0.0760).toFixed(2));
  const tributosAprox = Number((valorTotalNota * 0.275).toFixed(2));

  const enderecoDestinatario = pedido.tipo === 'retirada'
    ? 'Retirada Balcão Clique & Retire — Av. Calama, 4985, Porto Velho - RO'
    : (pedido.endereco
        ? `${pedido.endereco.logradouro}, ${pedido.endereco.numero} - ${pedido.endereco.bairro || 'Porto Velho'}, Porto Velho - RO`
        : 'Endereço em Porto Velho - RO');

  const qrCodeUrl = `https://dfe-portal.sefaz.ro.gov.br/nfe/consulta?chNFe=${chaveCompleta}&nNF=${numeroNfeSequencial}&tpAmb=2`;

  return {
    id: `nf-${pedido.id}`,
    pedido_id: pedido.id,
    numero_nfe: numeroNfeSequencial,
    serie: 1,
    chave_acesso: chaveCompleta,
    natureza_operacao: 'Venda de mercadoria ao consumidor final',
    cfop_padrao: '5.102',
    data_emissao: agora,
    status: 'autorizada',
    emitente_razao_social: CONFIG_LOJA_DEMO.razao_social || 'Improvement Supermercados Ltda',
    emitente_cnpj: CONFIG_LOJA_DEMO.cnpj || '12.345.678/0001-90',
    emitente_ie: CONFIG_LOJA_DEMO.inscricao_estadual || '123.456.789',
    emitente_endereco: CONFIG_LOJA_DEMO.endereco || 'Av. Calama, 4985 - Flodoaldo Pontes Pinto, Porto Velho - RO, 76820-408',
    destinatario_nome: pedido.cliente_nome || 'Consumidor Final',
    destinatario_cpf: '012.345.678-90',
    destinatario_endereco: enderecoDestinatario,
    valor_produtos: totalProdutos,
    valor_frete: totalFrete,
    valor_desconto: totalDesconto,
    valor_total_nota: valorTotalNota,
    base_calculo_icms: baseCalculoIcms,
    valor_total_icms: valorTotalIcms,
    aliquota_pis: 1.65,
    valor_pis: valorPis,
    aliquota_cofins: 7.60,
    valor_cofins: valorCofins,
    valor_tributos_aproximados: tributosAprox,
    forma_pagamento: pedido.tipo === 'retirada' ? 'PIX / Pagamento no Balcão' : 'Cartão de Crédito Online',
    qr_code_conteudo: qrCodeUrl,
    observacao_legal: 'Documento emitido eletronicamente – Projeto acadêmico IFRO Campus Porto Velho Calama. Sem valor fiscal real.',
    itens: itensNota,
    criado_em: agora,
  };
}

// ==========================================
// CONTAS A PAGAR DEMO
// ==========================================
export const CONTAS_PAGAR_DEMO: ContaPagar[] = [
  {
    id: 'cp-001',
    descricao: 'Compra de Laticínios e Iogurtes - Pedido #1001',
    categoria: 'compra_mercadorias',
    fornecedor_id: 'f0000000-0000-0000-0000-000000000002',
    fornecedor_nome: 'Laticínios Três Marias',
    pedido_compra_id: 'pc-001',
    valor_original: 1850.00,
    valor_ajustado: 1850.00,
    data_emissao: '2026-11-05',
    data_vencimento: '2026-11-12', // Vencida há 5 dias -> ALERTA VERMELHO
    status: 'vencida',
    observacoes: 'Boleto bancário em atraso — entrar em contato com o financeiro do fornecedor.',
    criado_em: '2026-11-05T10:00:00Z',
    atualizado_em: '2026-11-13T10:00:00Z',
  },
  {
    id: 'cp-002',
    descricao: 'Fatura Energisa Rondônia (Energia Elétrica Loja Calama)',
    categoria: 'luz',
    valor_original: 3420.50,
    valor_ajustado: 3420.50,
    data_emissao: '2026-11-01',
    data_vencimento: '2026-11-19', // Vence em 2 dias -> ALERTA AMARELO
    status: 'pendente',
    observacoes: 'Unidade consumidora #948201 - Débito autorizado no caixa.',
    criado_em: '2026-11-01T08:00:00Z',
    atualizado_em: '2026-11-01T08:00:00Z',
  },
  {
    id: 'cp-003',
    descricao: 'Compra de Farinhas e Grãos - Pedido #1002',
    categoria: 'compra_mercadorias',
    fornecedor_id: 'f0000000-0000-0000-0000-000000000003',
    fornecedor_nome: 'Moinho Guaporé',
    pedido_compra_id: 'pc-002',
    valor_original: 2400.00,
    valor_ajustado: 2160.00, // Ajustado pós conferência com avarias
    data_emissao: '2026-11-10',
    data_vencimento: '2026-11-28',
    status: 'pendente',
    observacoes: 'Faturado com abatimento de 10 pacotes avariados na entrega.',
    criado_em: '2026-11-10T14:00:00Z',
    atualizado_em: '2026-11-12T11:00:00Z',
  },
  {
    id: 'cp-004',
    descricao: 'Aluguel do Galpão Comercial (Av. Calama)',
    categoria: 'aluguel',
    valor_original: 6500.00,
    valor_ajustado: 6500.00,
    valor_pago: 6500.00,
    data_emissao: '2026-10-25',
    data_vencimento: '2026-11-05',
    data_pagamento: '2026-11-05',
    forma_pagamento: 'pix',
    status: 'paga',
    observacoes: 'Pago pontualmente com comprovante arquivado.',
    criado_em: '2026-10-25T08:00:00Z',
    atualizado_em: '2026-11-05T15:00:00Z',
  },
  {
    id: 'cp-005',
    descricao: 'Internet Fibra Óptica 1Gbps + Telefonia IP',
    categoria: 'internet',
    valor_original: 389.90,
    valor_ajustado: 389.90,
    valor_pago: 389.90,
    data_emissao: '2026-10-28',
    data_vencimento: '2026-11-08',
    data_pagamento: '2026-11-07',
    forma_pagamento: 'boleto',
    status: 'paga',
    criado_em: '2026-10-28T09:00:00Z',
    atualizado_em: '2026-11-07T11:30:00Z',
  },
];

// ==========================================
// PEDIDOS DE COMPRA DEMO
// ==========================================
export const PEDIDOS_COMPRA_DEMO: PedidoCompra[] = [
  {
    id: 'pc-001',
    numero_sequencial: 1001,
    fornecedor_id: 'f0000000-0000-0000-0000-000000000002',
    fornecedor_nome: 'Laticínios Três Marias',
    fornecedor_cnpj: '07.890.123/0001-44',
    status: 'recebido',
    valor_total_previsto: 1850.00,
    valor_total_realizado: 1850.00,
    data_emissao: '2026-11-05T09:00:00Z',
    previsao_entrega: '2026-11-08T14:00:00Z',
    gerar_conta_pagar: true,
    conta_pagar_id: 'cp-001',
    data_vencimento_acordada: '2026-11-12',
    observacoes: 'Recebimento 100% conferido sem avarias.',
    criado_por_usuario_id: 'a0000000-0000-0000-0000-000000000001',
    criado_em: '2026-11-05T09:00:00Z',
    atualizado_em: '2026-11-08T15:30:00Z',
    itens: [
      {
        id: 'ipc-001-1',
        pedido_compra_id: 'pc-001',
        produto_id: '33333333-0000-0000-0000-000000000002',
        produto_nome: 'Leite Integral 1 L',
        sku: 'SKU-01001',
        unidade: 'UN',
        preco_custo_unitario: 3.70,
        quantidade_pedida: 500,
        quantidade_recebida_acumulada: 500,
        quantidade_avaria_acumulada: 0,
        quantidade_saldo_restante: 0,
      },
    ],
  },
  {
    id: 'pc-002',
    numero_sequencial: 1002,
    fornecedor_id: 'f0000000-0000-0000-0000-000000000003',
    fornecedor_nome: 'Moinho Guaporé',
    fornecedor_cnpj: '14.567.890/0001-12',
    status: 'recebido_parcial',
    valor_total_previsto: 2400.00,
    valor_total_realizado: 2160.00,
    data_emissao: '2026-11-10T11:00:00Z',
    previsao_entrega: '2026-11-14T10:00:00Z',
    gerar_conta_pagar: true,
    conta_pagar_id: 'cp-003',
    data_vencimento_acordada: '2026-11-28',
    observacoes: 'Primeira remessa entregue com 10 avarias em caixas de farinha. Saldo restante de 80 unidades a entregar na próxima terça.',
    criado_por_usuario_id: 'a0000000-0000-0000-0000-000000000001',
    criado_em: '2026-11-10T11:00:00Z',
    atualizado_em: '2026-11-12T16:00:00Z',
    itens: [
      {
        id: 'ipc-002-1',
        pedido_compra_id: 'pc-002',
        produto_id: '33333333-0000-0000-0000-000000000036',
        produto_nome: 'Farinha de Trigo Tradicional 1 kg',
        sku: 'SKU-01036',
        unidade: 'PCT',
        preco_custo_unitario: 3.00,
        quantidade_pedida: 800,
        quantidade_recebida_acumulada: 720,
        quantidade_avaria_acumulada: 10,
        quantidade_saldo_restante: 80,
      },
    ],
  },
  {
    id: 'pc-003',
    numero_sequencial: 1003,
    fornecedor_id: 'f0000000-0000-0000-0000-000000000004',
    fornecedor_nome: 'Norte Bebidas & Higiene',
    fornecedor_cnpj: '22.334.556/0001-99',
    status: 'pendente', // PRONTO PARA CONFERÊNCIA
    valor_total_previsto: 1350.00,
    valor_total_realizado: 0,
    data_emissao: '2026-11-14T14:30:00Z',
    previsao_entrega: '2026-11-18T10:00:00Z',
    gerar_conta_pagar: true,
    data_vencimento_acordada: '2026-12-05',
    observacoes: 'Reposição de refrigerantes e sucos para o final de semana.',
    criado_por_usuario_id: 'a0000000-0000-0000-0000-000000000001',
    criado_em: '2026-11-14T14:30:00Z',
    atualizado_em: '2026-11-14T14:30:00Z',
    itens: [
      {
        id: 'ipc-003-1',
        pedido_compra_id: 'pc-003',
        produto_id: '33333333-0000-0000-0000-000000000041',
        produto_nome: 'Refrigerante Guaraná Antarctica 2 L',
        sku: 'SKU-01041',
        unidade: 'UN',
        preco_custo_unitario: 5.80,
        quantidade_pedida: 150,
        quantidade_recebida_acumulada: 0,
        quantidade_avaria_acumulada: 0,
        quantidade_saldo_restante: 150,
      },
      {
        id: 'ipc-003-2',
        pedido_compra_id: 'pc-003',
        produto_id: '33333333-0000-0000-0000-000000000040',
        produto_nome: 'Suco Integral de Uva 1 L',
        sku: 'SKU-01040',
        unidade: 'UN',
        preco_custo_unitario: 8.00,
        quantidade_pedida: 60,
        quantidade_recebida_acumulada: 0,
        quantidade_avaria_acumulada: 0,
        quantidade_saldo_restante: 60,
      },
    ],
  },
];

// ==========================================
// LANÇAMENTOS FINANCEIROS HISTÓRICOS (DRE / FLUXO DE CAIXA)
// ==========================================
export const LANCAMENTOS_FINANCEIROS_DEMO: LancamentoFinanceiro[] = [
  // Mês Atual (Novembro/2026)
  { id: 'lf-01', tipo: 'receita', descricao: 'Vendas do E-commerce - Semana 1 Nov', categoria: 'Vendas de Mercadorias', valor: 8940.50, data: '2026-11-07', criado_em: '2026-11-07T23:59:00Z' },
  { id: 'lf-02', tipo: 'receita', descricao: 'Vendas do E-commerce - Semana 2 Nov', categoria: 'Vendas de Mercadorias', valor: 9780.00, data: '2026-11-14', criado_em: '2026-11-14T23:59:00Z' },
  { id: 'lf-03', tipo: 'despesa', descricao: 'Aluguel do Prédio Av. Calama', categoria: 'Aluguel', valor: 6500.00, data: '2026-11-05', conta_pagar_id: 'cp-004', criado_em: '2026-11-05T15:00:00Z' },
  { id: 'lf-04', tipo: 'despesa', descricao: 'Fatura de Internet e Telefonia', categoria: 'Internet', valor: 389.90, data: '2026-11-07', conta_pagar_id: 'cp-005', criado_em: '2026-11-07T11:30:00Z' },
  { id: 'lf-05', tipo: 'despesa', descricao: 'Compra de Laticínios Três Marias', categoria: 'Compra de Mercadorias', valor: 1850.00, data: '2026-11-08', pedido_id: 'pc-001', criado_em: '2026-11-08T15:30:00Z' },
  
  // Meses Anteriores (para Gráfico de 6 Meses)
  { id: 'lf-06', tipo: 'receita', descricao: 'Faturamento Total Outubro/2026', categoria: 'Vendas de Mercadorias', valor: 38400.00, data: '2026-10-31', criado_em: '2026-10-31T23:59:00Z' },
  { id: 'lf-07', tipo: 'despesa', descricao: 'Despesas Totais Outubro/2026', categoria: 'Despesas Operacionais', valor: 27900.00, data: '2026-10-31', criado_em: '2026-10-31T23:59:00Z' },
  { id: 'lf-08', tipo: 'receita', descricao: 'Faturamento Total Setembro/2026', categoria: 'Vendas de Mercadorias', valor: 36200.00, data: '2026-09-30', criado_em: '2026-09-30T23:59:00Z' },
  { id: 'lf-09', tipo: 'despesa', descricao: 'Despesas Totais Setembro/2026', categoria: 'Despesas Operacionais', valor: 26100.00, data: '2026-09-30', criado_em: '2026-09-30T23:59:00Z' },
  { id: 'lf-10', tipo: 'receita', descricao: 'Faturamento Total Agosto/2026', categoria: 'Vendas de Mercadorias', valor: 34800.00, data: '2026-08-31', criado_em: '2026-08-31T23:59:00Z' },
  { id: 'lf-11', tipo: 'despesa', descricao: 'Despesas Totais Agosto/2026', categoria: 'Despesas Operacionais', valor: 25400.00, data: '2026-08-31', criado_em: '2026-08-31T23:59:00Z' },
  { id: 'lf-12', tipo: 'receita', descricao: 'Faturamento Total Julho/2026', categoria: 'Vendas de Mercadorias', valor: 33100.00, data: '2026-07-31', criado_em: '2026-07-31T23:59:00Z' },
  { id: 'lf-13', tipo: 'despesa', descricao: 'Despesas Totais Julho/2026', categoria: 'Despesas Operacionais', valor: 24800.00, data: '2026-07-31', criado_em: '2026-07-31T23:59:00Z' },
  { id: 'lf-14', tipo: 'receita', descricao: 'Faturamento Total Junho/2026', categoria: 'Vendas de Mercadorias', valor: 31900.00, data: '2026-06-30', criado_em: '2026-06-30T23:59:00Z' },
  { id: 'lf-15', tipo: 'despesa', descricao: 'Despesas Totais Junho/2026', categoria: 'Despesas Operacionais', valor: 23900.00, data: '2026-06-30', criado_em: '2026-06-30T23:59:00Z' },
];

// ==========================================
// LOGS DE AUDITORIA INICIAIS
// ==========================================
export const LOGS_AUDITORIA_DEMO: LogAuditoria[] = [
  {
    id: 'log-01',
    tipo: 'sistema',
    acao: 'Inicialização do Sistema',
    descricao: 'Carga de parâmetros iniciais e catálogo comercial (IFRO Calama)',
    usuario_id: 'a0000000-0000-0000-0000-000000000001',
    usuario_nome: 'Administrador Geral',
    criado_em: '2026-11-01T08:00:00Z',
  },
  {
    id: 'log-02',
    tipo: 'recebimento_compra',
    acao: 'Conferência de Recebimento',
    descricao: 'Recebimento de 500 un de Leite Integral (Pedido Compra #1001) sem avarias',
    usuario_id: 'a0000000-0000-0000-0000-000000000001',
    usuario_nome: 'Administrador Geral',
    detalhes: { motivo: 'Entrega 100% de acordo com a NF do fornecedor' },
    criado_em: '2026-11-08T15:30:00Z',
  },
  {
    id: 'log-03',
    tipo: 'recebimento_compra',
    acao: 'Recebimento Parcial com Avarias',
    descricao: 'Recebimento do Pedido Compra #1002 (Moinho Guaporé): 720 recebidos, 10 avarias registradas, 80 pendentes',
    usuario_id: 'a0000000-0000-0000-0000-000000000001',
    usuario_nome: 'Administrador Geral',
    detalhes: { motivo: 'Avaria em transporte (sacos rasgados na carga)' },
    criado_em: '2026-11-12T16:00:00Z',
  },
  {
    id: 'log-04',
    tipo: 'financeiro',
    acao: 'Baixa de Conta a Pagar',
    descricao: 'Pagamento de R$ 6.500,00 referente ao Aluguel do Prédio Av. Calama',
    usuario_id: 'a0000000-0000-0000-0000-000000000001',
    usuario_nome: 'Administrador Geral',
    detalhes: { antes: 'pendente', depois: 'paga' },
    criado_em: '2026-11-05T15:00:00Z',
  },
];
