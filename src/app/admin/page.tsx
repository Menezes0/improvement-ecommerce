'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  PRODUTOS_DEMO,
  CATEGORIAS_DEMO,
  USUARIOS_DEMO,
  ZONAS_DEMO,
  CONFIG_LOJA_DEMO,
} from '@/lib/demo-data';
import {
  FORNECEDORES_DEMO,
  PEDIDOS_COMPRA_DEMO,
  CONTAS_PAGAR_DEMO,
  LANCAMENTOS_FINANCEIROS_DEMO,
  LOGS_AUDITORIA_DEMO,
  normalizarProduto,
  gerarNotaFiscalDePedido,
} from '@/lib/admin-data';
import {
  Produto,
  Categoria,
  ZonaEntrega,
  Usuario,
  ConfigLoja,
  Pedido,
  PedidoCompra,
  StatusPedidoCompra,
  ContaPagar,
  LancamentoFinanceiro,
  NotaFiscal,
  LogAuditoria,
  TipoAcaoAuditoria,
  StatusPedido,
  Oferta,
} from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import {
  ShieldAlert,
  LayoutDashboard,
  Package,
  FolderTree,
  Flame,
  ShoppingBag,
  Users,
  Truck,
  DollarSign,
  FileText,
  Activity,
  Settings,
  CheckCircle,
  RefreshCcw,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';

// Subcomponentes Modulares
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminProdutos } from '@/components/admin/AdminProdutos';
import { AdminCategorias } from '@/components/admin/AdminCategorias';
import { AdminOfertas } from '@/components/admin/AdminOfertas';
import { AdminPedidos } from '@/components/admin/AdminPedidos';
import { AdminClientesOperadores } from '@/components/admin/AdminClientesOperadores';
import { AdminCompras } from '@/components/admin/AdminCompras';
import { AdminFinanceiro } from '@/components/admin/AdminFinanceiro';
import { AdminFiscal } from '@/components/admin/AdminFiscal';
import { AdminAuditoria } from '@/components/admin/AdminAuditoria';
import { AdminConfiguracoes } from '@/components/admin/AdminConfiguracoes';
import { NotaFiscalModal } from '@/components/admin/NotaFiscalModal';

type AdminTab =
  | 'dashboard'
  | 'produtos'
  | 'categorias'
  | 'ofertas'
  | 'pedidos'
  | 'clientes_operadores'
  | 'compras'
  | 'financeiro'
  | 'fiscal'
  | 'auditoria'
  | 'configuracoes';

export default function PainelAdminPage() {
  const { papel, loginAsDemo, usuario } = useAuth();
  const { setZonaSelecionada, pedidosRealizados } = useCart();
  const [tabAtiva, setTabAtiva] = useState<AdminTab>('dashboard');
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  // Estados com persistência local
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_DEMO);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_DEMO);
  const [fornecedores, setFornecedores] = useState(FORNECEDORES_DEMO);
  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompra[]>(PEDIDOS_COMPRA_DEMO);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>(CONTAS_PAGAR_DEMO);
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>(LANCAMENTOS_FINANCEIROS_DEMO);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<LogAuditoria[]>(LOGS_AUDITORIA_DEMO);
  const [zonas, setZonas] = useState<ZonaEntrega[]>(ZONAS_DEMO);
  const [configLoja, setConfigLoja] = useState<ConfigLoja>(CONFIG_LOJA_DEMO);

  // Estado para Modal de DANFE
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isRestaurando, setIsRestaurando] = useState(false);

  // Carga inicial e persistência em localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Produtos
    const savedProds = localStorage.getItem('improvement_produtos');
    if (savedProds) {
      try {
        setProdutos(JSON.parse(savedProds));
      } catch {
        setProdutos(PRODUTOS_DEMO.map((p, idx) => normalizarProduto(p, idx)));
      }
    } else {
      const normalizados = PRODUTOS_DEMO.map((p, idx) => normalizarProduto(p, idx));
      setProdutos(normalizados);
      localStorage.setItem('improvement_produtos', JSON.stringify(normalizados));
    }

    // Categorias
    const savedCats = localStorage.getItem('improvement_categorias');
    if (savedCats) {
      try {
        setCategorias(JSON.parse(savedCats));
      } catch {}
    }

    // Compras
    const savedCompras = localStorage.getItem('improvement_compras');
    if (savedCompras) {
      try {
        setPedidosCompra(JSON.parse(savedCompras));
      } catch {}
    }

    // Contas a Pagar
    const savedContas = localStorage.getItem('improvement_contas_pagar');
    if (savedContas) {
      try {
        setContasPagar(JSON.parse(savedContas));
      } catch {}
    }

    // Lançamentos
    const savedLanc = localStorage.getItem('improvement_lancamentos');
    if (savedLanc) {
      try {
        setLancamentos(JSON.parse(savedLanc));
      } catch {}
    }

    // Notas Fiscais
    const savedNFs = localStorage.getItem('improvement_notas_fiscais');
    if (savedNFs) {
      try {
        setNotasFiscais(JSON.parse(savedNFs));
      } catch {}
    }

    // Auditoria
    const savedLogs = localStorage.getItem('improvement_auditoria');
    if (savedLogs) {
      try {
        setLogsAuditoria(JSON.parse(savedLogs));
      } catch {}
    }

    // Zonas
    const savedZonas = localStorage.getItem('improvement_zonas');
    if (savedZonas) {
      try {
        setZonas(JSON.parse(savedZonas));
      } catch {}
    }

    // Config Loja
    const savedConfig = localStorage.getItem('improvement_config_loja');
    if (savedConfig) {
      try {
        setConfigLoja(JSON.parse(savedConfig));
      } catch {}
    }
  }, []);

  // Sincronizar Pedidos do Carrinho e gerar Notas Fiscais automáticas para os concluídos
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedPedidos = localStorage.getItem('improvement_pedidos_demo');
    let listaPedidos: Pedido[] = [];
    if (savedPedidos) {
      try {
        listaPedidos = JSON.parse(savedPedidos);
      } catch {}
    }

    // Se estiver vazio, gera 3 pedidos simulados realistas
    if (listaPedidos.length === 0) {
      listaPedidos = [
        {
          id: 'ped-202611-001',
          usuario_id: 'c0000000-0000-0000-0000-000000000003',
          tipo: 'entrega',
          status: 'concluido',
          cliente_nome: 'Maria da Silva',
          cliente_email: 'maria@exemplo.com',
          subtotal: 68.90,
          frete: 6.00,
          total: 74.90,
          a_caminho: false,
          criado_em: '2026-11-14T10:30:00Z',
          atualizado_em: '2026-11-14T11:45:00Z',
          endereco: {
            id: 'end-1',
            usuario_id: 'c0000000-0000-0000-0000-000000000003',
            zona_id: '22222222-0000-0000-0000-000000000001',
            logradouro: 'Rua Benjamin Constant',
            numero: '450',
            bairro: 'Olaria',
            cep: '76801-200',
            padrao: true,
          },
          itens: [
            {
              id: 'item-1-1',
              pedido_id: 'ped-202611-001',
              produto_id: '33333333-0000-0000-0000-000000000002',
              quantidade: 2,
              preco_unitario: 5.99,
              regra_substituicao: 'troca_marca',
              situacao: 'separado',
              produto: PRODUTOS_DEMO[0],
            },
          ],
        },
        {
          id: 'ped-202611-002',
          usuario_id: 'c0000000-0000-0000-0000-000000000004',
          tipo: 'retirada',
          status: 'pronto',
          cliente_nome: 'João Santos',
          cliente_email: 'joao@exemplo.com',
          subtotal: 42.50,
          frete: 0,
          total: 42.50,
          a_caminho: true,
          criado_em: '2026-11-15T14:10:00Z',
          atualizado_em: '2026-11-15T14:35:00Z',
          itens: [
            {
              id: 'item-2-1',
              pedido_id: 'ped-202611-002',
              produto_id: '33333333-0000-0000-0000-000000000041',
              quantidade: 3,
              preco_unitario: 8.99,
              regra_substituicao: 'nao_substituir',
              situacao: 'separado',
              produto: PRODUTOS_DEMO[5] || PRODUTOS_DEMO[0],
            },
          ],
        },
      ];
      localStorage.setItem('improvement_pedidos_demo', JSON.stringify(listaPedidos));
    }

    setPedidos(listaPedidos);

    // Gerar notas fiscais correspondentes
    const prodsBase = produtos.length > 0 ? produtos : PRODUTOS_DEMO;
    const nfsGeradas = listaPedidos.map((ped, idx) =>
      gerarNotaFiscalDePedido(ped, prodsBase, 1040 + idx)
    );
    setNotasFiscais(nfsGeradas);
    localStorage.setItem('improvement_notas_fiscais', JSON.stringify(nfsGeradas));
  }, [produtos.length]);

  // Contagem de Contas Vencidas para o badge
  const contasVencidasContador = contasPagar.filter(
    (c) => c.status === 'vencida' || (c.status === 'pendente' && new Date(c.data_vencimento) < new Date())
  ).length;

  // Proteção de Rota (RF03: Administrador Geral)
  if (papel !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-purple-200 text-center space-y-4 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-purple-600 mx-auto" />
        <h2 className="text-xl font-black text-purple-950">403 — Acesso Restrito</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          O Painel de Administração e Gestão Completa é exclusivo do perfil <strong>ADMINISTRADOR</strong> (RF03).
        </p>
        <div className="pt-2">
          <button
            onClick={() => loginAsDemo('admin')}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition cursor-pointer"
          >
            Entrar como Administrador Geral
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // HANDLERS DE AÇÕES
  // ==========================================

  // 1. Salvar Produto (Novo ou Editado)
  const handleSalvarProduto = (prod: Produto) => {
    const existe = produtos.some((p) => p.id === prod.id);
    const atualizados = existe
      ? produtos.map((p) => (p.id === prod.id ? prod : p))
      : [prod, ...produtos];

    setProdutos(atualizados);
    localStorage.setItem('improvement_produtos', JSON.stringify(atualizados));

    // Gravar Auditoria
    adicionarLogAuditoria(
      'preco',
      existe ? 'Edição de Produto' : 'Cadastro de Produto',
      `${prod.nome} — Venda: R$ ${prod.preco.toFixed(2)} | Custo: R$ ${(prod.preco_custo || 0).toFixed(2)} | Margem: ${prod.margem_lucro_percentual}%`
    );

    setStatusMsg(`Produto "${prod.nome}" salvo com sucesso!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Toggle Status Produto (Soft Delete)
  const handleToggleStatusProduto = (produtoId: string) => {
    const atualizados = produtos.map((p) =>
      p.id === produtoId ? { ...p, ativo: !p.ativo } : p
    );
    setProdutos(atualizados);
    localStorage.setItem('improvement_produtos', JSON.stringify(atualizados));

    const mod = atualizados.find((p) => p.id === produtoId);
    adicionarLogAuditoria(
      'estoque',
      mod?.ativo ? 'Reativação de Produto' : 'Desativação de Produto (Soft Delete)',
      `Produto ${mod?.nome} foi ${mod?.ativo ? 'reativado' : 'desativado'}`
    );
  };

  // 2. Salvar Categoria
  const handleSalvarCategoria = (cat: Categoria) => {
    const existe = categorias.some((c) => c.id === cat.id);
    const atualizadas = existe
      ? categorias.map((c) => (c.id === cat.id ? cat : c))
      : [...categorias, cat];

    setCategorias(atualizadas);
    localStorage.setItem('improvement_categorias', JSON.stringify(atualizadas));
    setStatusMsg(`Categoria "${cat.nome}" atualizada com alíquota ICMS de ${cat.aliquota_icms}%!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleToggleCategoria = (catId: string) => {
    const atualizadas = categorias.map((c) =>
      c.id === catId ? { ...c, ativa: !c.ativa } : c
    );
    setCategorias(atualizadas);
    localStorage.setItem('improvement_categorias', JSON.stringify(atualizadas));
  };

  // 3. Salvar Oferta
  const handleSalvarOferta = (oferta: Oferta) => {
    const existe = ofertas.some((o) => o.id === oferta.id);
    const atualizadas = existe
      ? ofertas.map((o) => (o.id === oferta.id ? oferta : o))
      : [oferta, ...ofertas];

    setOfertas(atualizadas);

    // Atualizar produto correspondente para refletir preço promocional no catálogo
    const prodsAtualizados = produtos.map((p) => {
      if (p.id === oferta.produto_id) {
        return {
          ...p,
          preco_promocional: oferta.ativa ? oferta.preco_promocional : null,
          oferta_ativa: oferta.ativa,
        };
      }
      return p;
    });
    setProdutos(prodsAtualizados);
    localStorage.setItem('improvement_produtos', JSON.stringify(prodsAtualizados));

    adicionarLogAuditoria(
      'oferta',
      'Criação/Edição de Oferta',
      `Oferta ativa para produto: de R$ ${oferta.preco_original?.toFixed(2)} por R$ ${oferta.preco_promocional.toFixed(2)}`
    );

    setStatusMsg(`Oferta salva com sucesso! Preço riscado ativo no frontend.`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleToggleOferta = (ofertaId: string) => {
    const atualizadas = ofertas.map((o) =>
      o.id === ofertaId ? { ...o, ativa: !o.ativa } : o
    );
    setOfertas(atualizadas);
  };

  // 4. Módulo de Compras: Criar Pedido de Compra
  const handleCriarPedidoCompra = (novo: PedidoCompra) => {
    const novosPedidos = [novo, ...pedidosCompra];
    setPedidosCompra(novosPedidos);
    localStorage.setItem('improvement_compras', JSON.stringify(novosPedidos));

    // Se marcou para gerar conta a pagar
    if (novo.gerar_conta_pagar && novo.data_vencimento_acordada) {
      const novaConta: ContaPagar = {
        id: `cp-${Date.now()}`,
        descricao: `Compra Fornecedor ${novo.fornecedor_nome} - Pedido #${novo.numero_sequencial}`,
        categoria: 'compra_mercadorias',
        fornecedor_id: novo.fornecedor_id,
        fornecedor_nome: novo.fornecedor_nome,
        pedido_compra_id: novo.id,
        valor_original: novo.valor_total_previsto,
        valor_ajustado: novo.valor_total_previsto,
        data_emissao: novo.data_emissao.slice(0, 10),
        data_vencimento: novo.data_vencimento_acordada,
        status: 'pendente',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      const novasContas = [novaConta, ...contasPagar];
      setContasPagar(novasContas);
      localStorage.setItem('improvement_contas_pagar', JSON.stringify(novasContas));
    }

    adicionarLogAuditoria(
      'recebimento_compra',
      'Emissão de Pedido de Compra',
      `Pedido Compra #${novo.numero_sequencial} emitido para ${novo.fornecedor_nome} no valor previsto de R$ ${novo.valor_total_previsto.toFixed(2)}`
    );
  };

  // 5. Módulo de Compras: Confirmar Recebimento de Mercadorias (Conferência Física)
  const handleConfirmarRecebimento = (
    pedidoId: string,
    recebimentos: {
      itemId: string;
      produtoId: string;
      qtdRecebida: number;
      qtdAvaria: number;
      motivoDivergencia: string;
      observacoes: string;
    }[]
  ) => {
    let valorLiquidoRecebidoTotal = 0;
    const prodsAtualizados = [...produtos];

    // Atualizar itens do pedido de compra
    const comprasAtualizadas = pedidosCompra.map((pc) => {
      if (pc.id === pedidoId) {
        let todosItensZerados = true;
        const itensAtualizados = pc.itens.map((it) => {
          const rec = recebimentos.find((r) => r.itemId === it.id);
          if (rec) {
            const entradaLiquida = Math.max(0, rec.qtdRecebida - rec.qtdAvaria);
            valorLiquidoRecebidoTotal += entradaLiquida * it.preco_custo_unitario;

            // 1. Atualizar estoque físico do produto no catálogo
            const idxP = prodsAtualizados.findIndex((p) => p.id === it.produto_id);
            if (idxP >= 0) {
              prodsAtualizados[idxP] = {
                ...prodsAtualizados[idxP],
                estoque: prodsAtualizados[idxP].estoque + entradaLiquida,
                preco_custo: it.preco_custo_unitario, // atualiza custo praticado
              };
            }

            const novoAcumuladoRecebido = it.quantidade_recebida_acumulada + rec.qtdRecebida;
            const novoAcumuladoAvaria = it.quantidade_avaria_acumulada + rec.qtdAvaria;
            const novoSaldo = Math.max(0, it.quantidade_pedida - novoAcumuladoRecebido);

            if (novoSaldo > 0) todosItensZerados = false;

            return {
              ...it,
              quantidade_recebida_acumulada: novoAcumuladoRecebido,
              quantidade_avaria_acumulada: novoAcumuladoAvaria,
              quantidade_saldo_restante: novoSaldo,
            };
          }
          if (it.quantidade_saldo_restante > 0) todosItensZerados = false;
          return it;
        });

        const novoStatus: StatusPedidoCompra = todosItensZerados ? 'recebido' : 'recebido_parcial';

        return {
          ...pc,
          status: novoStatus,
          valor_total_realizado: pc.valor_total_realizado + valorLiquidoRecebidoTotal,
          atualizado_em: new Date().toISOString(),
          itens: itensAtualizados,
        };
      }
      return pc;
    });

    setPedidosCompra(comprasAtualizadas);
    localStorage.setItem('improvement_compras', JSON.stringify(comprasAtualizadas));

    setProdutos(prodsAtualizados);
    localStorage.setItem('improvement_produtos', JSON.stringify(prodsAtualizados));

    // 2. Geração automática de Despesa Financeira
    const novoLancamento: LancamentoFinanceiro = {
      id: `lf-${Date.now()}`,
      tipo: 'despesa',
      descricao: `Recebimento Mercadorias - Pedido Compra #${pedidosCompra.find((p) => p.id === pedidoId)?.numero_sequencial}`,
      categoria: 'Compra de Mercadorias',
      valor: Number(valorLiquidoRecebidoTotal.toFixed(2)),
      data: new Date().toISOString().slice(0, 10),
      pedido_id: pedidoId,
      criado_em: new Date().toISOString(),
    };
    const lancAtualizados = [novoLancamento, ...lancamentos];
    setLancamentos(lancAtualizados);
    localStorage.setItem('improvement_lancamentos', JSON.stringify(lancAtualizados));

    // 3. Ajuste de Conta a Pagar vinculada (caso valor tenha sofrido abatimento por avaria)
    const contasAtualizadas = contasPagar.map((c) => {
      if (c.pedido_compra_id === pedidoId) {
        return {
          ...c,
          valor_ajustado: Number(valorLiquidoRecebidoTotal.toFixed(2)),
          observacoes: 'Valor ajustado com base na conferência física líquida.',
        };
      }
      return c;
    });
    setContasPagar(contasAtualizadas);
    localStorage.setItem('improvement_contas_pagar', JSON.stringify(contasAtualizadas));

    // 4. Registro na Auditoria
    adicionarLogAuditoria(
      'recebimento_compra',
      'Conferência de Recebimento de Mercadoria',
      `Pedido Compra conferido. Entrada líquida de estoque calculada em R$ ${valorLiquidoRecebidoTotal.toFixed(2)}. Divergências e avarias registradas.`
    );
  };

  // 6. Financeiro: Marcar Conta como Paga
  const handlePagarConta = (contaId: string, formaPagamento: string, dataPagamento: string) => {
    const atualizadas = contasPagar.map((c) =>
      c.id === contaId
        ? {
            ...c,
            status: 'paga' as const,
            forma_pagamento: formaPagamento as ContaPagar['forma_pagamento'],
            data_pagamento: dataPagamento,
            valor_pago: c.valor_ajustado,
          }
        : c
    );
    setContasPagar(atualizadas);
    localStorage.setItem('improvement_contas_pagar', JSON.stringify(atualizadas));

    const paga = atualizadas.find((c) => c.id === contaId);
    adicionarLogAuditoria(
      'financeiro',
      'Baixa de Conta a Pagar',
      `Conta "${paga?.descricao}" liquidada no valor de R$ ${paga?.valor_ajustado.toFixed(2)} via ${formaPagamento.toUpperCase()}`
    );

    setStatusMsg(`Conta "${paga?.descricao}" marcada como paga com sucesso!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // 7. Financeiro: Nova Conta a Pagar Manual
  const handleCriarContaPagar = (conta: ContaPagar) => {
    const novas = [conta, ...contasPagar];
    setContasPagar(novas);
    localStorage.setItem('improvement_contas_pagar', JSON.stringify(novas));

    adicionarLogAuditoria(
      'financeiro',
      'Lançamento de Conta a Pagar',
      `Conta "${conta.descricao}" cadastrada no valor de R$ ${conta.valor_original.toFixed(2)} com vencimento em ${conta.data_vencimento}`
    );
  };

  // 8. Financeiro: Lançamento Manual
  const handleCriarLancamentoManual = (lanc: LancamentoFinanceiro) => {
    const novos = [lanc, ...lancamentos];
    setLancamentos(novos);
    localStorage.setItem('improvement_lancamentos', JSON.stringify(novos));
  };

  // 9. Pedidos: Alterar Status Manualmente com Motivo
  const handleAlterarStatusPedido = (pedidoId: string, novoStatus: StatusPedido, motivo: string) => {
    const atualizados = pedidos.map((p) =>
      p.id === pedidoId ? { ...p, status: novoStatus, atualizado_em: new Date().toISOString() } : p
    );
    setPedidos(atualizados);
    localStorage.setItem('improvement_pedidos_demo', JSON.stringify(atualizados));

    // Se o pedido foi concluído/pago, emitir NF-e automaticamente caso ainda não exista
    if (novoStatus === 'concluido') {
      const pedidoObj = atualizados.find((p) => p.id === pedidoId);
      if (pedidoObj && !notasFiscais.some((nf) => nf.pedido_id === pedidoId)) {
        const novaNfe = gerarNotaFiscalDePedido(pedidoObj, produtos, 1040 + notasFiscais.length);
        const nfsNovas = [novaNfe, ...notasFiscais];
        setNotasFiscais(nfsNovas);
        localStorage.setItem('improvement_notas_fiscais', JSON.stringify(nfsNovas));
      }
    }

    adicionarLogAuditoria(
      'pedido',
      'Alteração Manual de Status de Pedido',
      `Pedido #${pedidoId.slice(0, 8)} alterado para "${novoStatus.toUpperCase()}". Motivo: ${motivo}`
    );

    setStatusMsg(`Status do pedido #${pedidoId.slice(0, 8)} alterado para ${novoStatus.toUpperCase()}!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // 10. Clientes e Operadores
  const handleToggleUsuarioAtivo = (usuarioId: string) => {
    const atualizados = usuarios.map((u) =>
      u.id === usuarioId ? { ...u, ativo: !u.ativo } : u
    );
    setUsuarios(atualizados);
    const mod = atualizados.find((u) => u.id === usuarioId);
    adicionarLogAuditoria(
      'cliente',
      mod?.ativo ? 'Desbloqueio de Usuário' : 'Bloqueio de Usuário',
      `Conta de ${mod?.nome} (${mod?.email}) ${mod?.ativo ? 'desbloqueada' : 'bloqueada'}`
    );
  };

  const handleCadastrarOperador = (novoOp: Usuario) => {
    const novos = [novoOp, ...usuarios];
    setUsuarios(novos);
    adicionarLogAuditoria(
      'operador',
      'Cadastro de Operador',
      `Novo operador ${novoOp.nome} (${novoOp.email}) cadastrado com acesso ao sistema.`
    );
    setStatusMsg(`Operador "${novoOp.nome}" cadastrado com sucesso!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // 11. Configurações da Loja
  const handleSalvarConfigLoja = (novaConf: ConfigLoja) => {
    setConfigLoja(novaConf);
    localStorage.setItem('improvement_config_loja', JSON.stringify(novaConf));
    adicionarLogAuditoria(
      'sistema',
      'Alteração das Configurações da Loja',
      `Atualização cadastral e fiscal da loja física em Porto Velho.`
    );
  };

  const handleAlterarTaxaBairro = (zonaId: string, novaTaxa: number) => {
    const atualizadas = zonas.map((z) =>
      z.id === zonaId ? { ...z, taxa_frete: novaTaxa } : z
    );
    setZonas(atualizadas);
    localStorage.setItem('improvement_zonas', JSON.stringify(atualizadas));
    const alterada = atualizadas.find((z) => z.id === zonaId);
    if (alterada) setZonaSelecionada(alterada);

    adicionarLogAuditoria(
      'sistema',
      'Alteração de Taxa de Frete (CA32)',
      `Taxa de frete do bairro ${alterada?.bairro} alterada para R$ ${novaTaxa.toFixed(2)}`
    );
  };

  // Helper de gravação de Log de Auditoria
  const adicionarLogAuditoria = (tipo: TipoAcaoAuditoria, acao: string, descricao: string, detalhes?: LogAuditoria['detalhes']) => {
    const novoLog: LogAuditoria = {
      id: `log-${Date.now()}`,
      tipo,
      acao,
      descricao,
      usuario_id: usuario?.id || 'a0000000-0000-0000-0000-000000000001',
      usuario_nome: usuario?.nome || 'Administrador Geral',
      detalhes,
      criado_em: new Date().toISOString(),
    };
    const atualizados = [novoLog, ...logsAuditoria];
    setLogsAuditoria(atualizados);
    localStorage.setItem('improvement_auditoria', JSON.stringify(atualizados));
  };

  // Restauração de Dados Simulados (RF25, CA33)
  const handleRestaurarDadosSimulados = () => {
    setIsRestaurando(true);
    setStatusMsg(null);

    setTimeout(() => {
      localStorage.removeItem('improvement_produtos');
      localStorage.removeItem('improvement_categorias');
      localStorage.removeItem('improvement_compras');
      localStorage.removeItem('improvement_contas_pagar');
      localStorage.removeItem('improvement_lancamentos');
      localStorage.removeItem('improvement_notas_fiscais');
      localStorage.removeItem('improvement_auditoria');
      localStorage.removeItem('improvement_zonas');
      localStorage.removeItem('improvement_config_loja');

      const normalizados = PRODUTOS_DEMO.map((p, idx) => normalizarProduto(p, idx));
      setProdutos(normalizados);
      setCategorias(CATEGORIAS_DEMO);
      setPedidosCompra(PEDIDOS_COMPRA_DEMO);
      setContasPagar(CONTAS_PAGAR_DEMO);
      setLancamentos(LANCAMENTOS_FINANCEIROS_DEMO);
      setLogsAuditoria(LOGS_AUDITORIA_DEMO);
      setZonas(ZONAS_DEMO);
      setConfigLoja(CONFIG_LOJA_DEMO);

      setIsRestaurando(false);
      setStatusMsg(
        'Base de dados simulada resetada com sucesso: 65+ produtos, 9 categorias com alíquotas fiscais, contas a pagar e auditoria restauradas (RF25, CA33)!'
      );
    }, 1200);
  };

  // Itens de Menu da Sidebar
  const itensMenu = [
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard },
    { id: 'produtos', label: 'Catálogo de Produtos', icon: Package },
    { id: 'categorias', label: 'Categorias & ICMS', icon: FolderTree },
    { id: 'ofertas', label: 'Mural de Ofertas', icon: Flame },
    { id: 'pedidos', label: 'Gestão de Pedidos', icon: ShoppingBag },
    { id: 'compras', label: 'Compras & Recebimento', icon: Truck },
    {
      id: 'financeiro',
      label: 'Módulo Financeiro',
      icon: DollarSign,
      badge: contasVencidasContador > 0 ? `${contasVencidasContador} vencida(s)` : undefined,
    },
    { id: 'fiscal', label: 'Notas Fiscais (NF-e)', icon: FileText },
    { id: 'clientes_operadores', label: 'Clientes & Operadores', icon: Users },
    { id: 'auditoria', label: 'Auditoria & Logs', icon: Activity },
    { id: 'configuracoes', label: 'Configurações da Loja', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Cabeçalho do Painel Admin */}
      <div className="bg-gradient-to-r from-emerald-950 via-green-950 to-emerald-900 rounded-3xl p-6 sm:p-7 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-200 bg-emerald-800/80 px-3 py-1 rounded-full uppercase tracking-wider">
              Painel de Gestão Empresarial
            </span>
            <span className="text-xs text-emerald-300 font-bold hidden sm:inline">
              IFRO Campus Porto Velho Calama
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Improvement Supermercados
          </h1>
          <p className="text-xs text-emerald-200/90 mt-0.5">
            Sistema integrado de Catálogo, Operação, Compras com Conferência de Doca, Financeiro e Emissão de Nota Fiscal.
          </p>
        </div>

        {/* Botão de Carga e Restauração Inicial (RF25, CA33) */}
        <button
          onClick={handleRestaurarDadosSimulados}
          disabled={isRestaurando}
          className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs py-2.5 px-4 rounded-2xl shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isRestaurando ? 'animate-spin' : ''}`} />
          {isRestaurando ? 'Restaurando Base...' : 'Restaurar Dados Simulados (RF25)'}
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Layout com Sidebar e Área de Conteúdo */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Menu Lateral / Navegação */}
        <div className="w-full lg:w-64 bg-white rounded-3xl border border-gray-200 p-3 shadow-xs shrink-0 space-y-1">
          <div className="px-3 py-2 text-[10px] font-black uppercase text-gray-400 tracking-wider">
            Navegação Principal
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
            {itensMenu.map((item) => {
              const Icon = item.icon;
              const isAtivo = tabAtiva === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setTabAtiva(item.id as AdminTab)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer text-left ${
                    isAtivo
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isAtivo ? 'text-emerald-300' : 'text-gray-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Área Central Dinâmica de Conteúdo */}
        <div className="flex-1 w-full min-w-0">
          {tabAtiva === 'dashboard' && (
            <AdminDashboard
              pedidos={pedidos}
              produtos={produtos}
              contasPagar={contasPagar}
              onNavigateTab={(tab) => setTabAtiva(tab as AdminTab)}
              onVerNotaFiscal={(p) => {
                const seq = Math.abs(parseInt(p.id.replace(/\D/g, '').slice(-4), 10) || 1042);
                setNotaSelecionada(gerarNotaFiscalDePedido(p, produtos, seq));
              }}
            />
          )}

          {tabAtiva === 'produtos' && (
            <AdminProdutos
              produtos={produtos}
              categorias={categorias}
              onSalvarProduto={handleSalvarProduto}
              onToggleStatus={handleToggleStatusProduto}
            />
          )}

          {tabAtiva === 'categorias' && (
            <AdminCategorias
              categorias={categorias}
              onSalvarCategoria={handleSalvarCategoria}
              onToggleCategoria={handleToggleCategoria}
            />
          )}

          {tabAtiva === 'ofertas' && (
            <AdminOfertas
              ofertas={ofertas}
              produtos={produtos}
              onSalvarOferta={handleSalvarOferta}
              onToggleOferta={handleToggleOferta}
            />
          )}

          {tabAtiva === 'pedidos' && (
            <AdminPedidos
              pedidos={pedidos}
              onAlterarStatus={handleAlterarStatusPedido}
              onVerNotaFiscal={(p) => {
                const seq = Math.abs(parseInt(p.id.replace(/\D/g, '').slice(-4), 10) || 1042);
                setNotaSelecionada(gerarNotaFiscalDePedido(p, produtos, seq));
              }}
            />
          )}

          {tabAtiva === 'compras' && (
            <AdminCompras
              pedidosCompra={pedidosCompra}
              fornecedores={fornecedores}
              produtos={produtos}
              onCriarPedidoCompra={handleCriarPedidoCompra}
              onConfirmarRecebimento={handleConfirmarRecebimento}
              onSalvarFornecedor={(f) => setFornecedores([f, ...fornecedores])}
            />
          )}

          {tabAtiva === 'financeiro' && (
            <AdminFinanceiro
              contasPagar={contasPagar}
              lancamentos={lancamentos}
              onPagarConta={handlePagarConta}
              onCriarContaPagar={handleCriarContaPagar}
              onCriarLancamentoManual={handleCriarLancamentoManual}
            />
          )}

          {tabAtiva === 'fiscal' && (
            <AdminFiscal
              notasFiscais={notasFiscais}
              onVisualizarNota={(nf) => setNotaSelecionada(nf)}
            />
          )}

          {tabAtiva === 'clientes_operadores' && (
            <AdminClientesOperadores
              usuarios={usuarios}
              pedidos={pedidos}
              onToggleUsuarioAtivo={handleToggleUsuarioAtivo}
              onCadastrarOperador={handleCadastrarOperador}
            />
          )}

          {tabAtiva === 'auditoria' && (
            <AdminAuditoria logs={logsAuditoria} />
          )}

          {tabAtiva === 'configuracoes' && (
            <AdminConfiguracoes
              configLoja={configLoja}
              zonas={zonas}
              onSalvarConfigLoja={handleSalvarConfigLoja}
              onAlterarTaxaBairro={handleAlterarTaxaBairro}
              onRestaurarDados={handleRestaurarDadosSimulados}
              isRestaurando={isRestaurando}
            />
          )}
        </div>
      </div>

      {/* Modal Global de Visualização do DANFE / NF-e */}
      <NotaFiscalModal
        nota={notaSelecionada}
        onClose={() => setNotaSelecionada(null)}
      />
    </div>
  );
}
