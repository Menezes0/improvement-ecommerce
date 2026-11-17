'use client';

import React, { useState } from 'react';
import {
  PedidoCompra,
  ItemPedidoCompra,
  Fornecedor,
  Produto,
  StatusPedidoCompra,
} from '@/types/database';
import {
  Truck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Building2,
  Clock,
  ArrowRight,
  FileCheck,
  X,
  Package,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface AdminComprasProps {
  pedidosCompra: PedidoCompra[];
  fornecedores: Fornecedor[];
  produtos: Produto[];
  onCriarPedidoCompra: (novoPedido: PedidoCompra) => void;
  onConfirmarRecebimento: (
    pedidoId: string,
    recebimentos: {
      itemId: string;
      produtoId: string;
      qtdRecebida: number;
      qtdAvaria: number;
      motivoDivergencia: string;
      observacoes: string;
    }[]
  ) => void;
  onSalvarFornecedor: (fornecedor: Fornecedor) => void;
}

export function AdminCompras({
  pedidosCompra,
  fornecedores,
  produtos,
  onCriarPedidoCompra,
  onConfirmarRecebimento,
  onSalvarFornecedor,
}: AdminComprasProps) {
  const [abaAtiva, setAbaAtiva] = useState<'pedidos' | 'conferencia' | 'fornecedores'>('pedidos');
  
  // Estado para Criar Novo Pedido de Compra
  const [modalNovoPedido, setModalNovoPedido] = useState(false);
  const [fornecedorSelecionadoId, setFornecedorSelecionadoId] = useState(fornecedores[0]?.id || '');
  const [dataPrevisao, setDataPrevisao] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [gerarContaPagar, setGerarContaPagar] = useState(true);
  const [dataVencimento, setDataVencimento] = useState(
    new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [itensNovoPedido, setItensNovoPedido] = useState<
    { produtoId: string; quantidade: number; precoCusto: number }[]
  >([{ produtoId: produtos[0]?.id || '', quantidade: 100, precoCusto: produtos[0]?.preco_custo || 5 }]);
  const [obsNovoPedido, setObsNovoPedido] = useState('');

  // Estado para Tela de Conferência de Recebimento
  const [pedidoConferindo, setPedidoConferindo] = useState<PedidoCompra | null>(
    pedidosCompra.find((p) => p.status === 'pendente' || p.status === 'recebido_parcial') || null
  );

  // Form de Conferência para os itens do pedido
  const [conferenciaItens, setConferenciaItens] = useState<
    Record<string, { qtdRecebida: number; qtdAvaria: number; motivo: string; obs: string }>
  >({});

  // Feedback de sucesso
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Inicializar conferência quando um pedido for selecionado
  const handleSelecionarPedidoConferencia = (p: PedidoCompra) => {
    setPedidoConferindo(p);
    setAbaAtiva('conferencia');
    const inicial: Record<string, { qtdRecebida: number; qtdAvaria: number; motivo: string; obs: string }> = {};
    p.itens.forEach((it) => {
      inicial[it.id] = {
        qtdRecebida: it.quantidade_saldo_restante,
        qtdAvaria: 0,
        motivo: 'Entrega conforme NF do fornecedor',
        obs: '',
      };
    });
    setConferenciaItens(inicial);
  };

  // Adicionar item ao novo pedido de compra
  const handleAdicionarItemForm = () => {
    const prod = produtos[0];
    setItensNovoPedido((prev) => [
      ...prev,
      { produtoId: prod?.id || '', quantidade: 50, precoCusto: prod?.preco_custo || 4.5 },
    ]);
  };

  const handleRemoverItemForm = (idx: number) => {
    setItensNovoPedido((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSalvarNovoPedido = (e: React.FormEvent) => {
    e.preventDefault();
    const forn = fornecedores.find((f) => f.id === fornecedorSelecionadoId);

    let totalPrevisto = 0;
    const itensFormatados: ItemPedidoCompra[] = itensNovoPedido.map((it, idx) => {
      const p = produtos.find((prod) => prod.id === it.produtoId);
      const sub = it.quantidade * it.precoCusto;
      totalPrevisto += sub;
      return {
        id: `ipc-${Date.now()}-${idx + 1}`,
        pedido_compra_id: `pc-${Date.now()}`,
        produto_id: it.produtoId,
        produto_nome: p?.nome || 'Item Selecionado',
        sku: p?.sku || `SKU-${idx + 100}`,
        unidade: p?.unidade || 'UN',
        preco_custo_unitario: it.precoCusto,
        quantidade_pedida: it.quantidade,
        quantidade_recebida_acumulada: 0,
        quantidade_avaria_acumulada: 0,
        quantidade_saldo_restante: it.quantidade,
      };
    });

    const seq = pedidosCompra.length + 1001;
    const novo: PedidoCompra = {
      id: `pc-${Date.now()}`,
      numero_sequencial: seq,
      fornecedor_id: fornecedorSelecionadoId,
      fornecedor_nome: forn?.nome_fantasia || 'Fornecedor',
      fornecedor_cnpj: forn?.cnpj || '00.000.000/0001-00',
      status: 'pendente',
      valor_total_previsto: Number(totalPrevisto.toFixed(2)),
      valor_total_realizado: 0,
      data_emissao: new Date().toISOString(),
      previsao_entrega: new Date(dataPrevisao).toISOString(),
      gerar_conta_pagar: gerarContaPagar,
      data_vencimento_acordada: gerarContaPagar ? dataVencimento : undefined,
      observacoes: obsNovoPedido.trim() || null,
      criado_por_usuario_id: 'a0000000-0000-0000-0000-000000000001',
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      itens: itensFormatados,
    };

    onCriarPedidoCompra(novo);
    setModalNovoPedido(false);
    setFeedbackMsg(`Pedido de Compra #${seq} gerado com sucesso para ${forn?.nome_fantasia}!`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Submissão da Conferência
  const handleConfirmarConferenciaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedidoConferindo) return;

    const payload = pedidoConferindo.itens.map((it) => {
      const conf = conferenciaItens[it.id] || {
        qtdRecebida: it.quantidade_saldo_restante,
        qtdAvaria: 0,
        motivo: '',
        obs: '',
      };
      return {
        itemId: it.id,
        produtoId: it.produto_id,
        qtdRecebida: Number(conf.qtdRecebida) || 0,
        qtdAvaria: Number(conf.qtdAvaria) || 0,
        motivoDivergencia: conf.motivo,
        observacoes: conf.obs,
      };
    });

    onConfirmarRecebimento(pedidoConferindo.id, payload);
    setFeedbackMsg(`Recebimento do Pedido #${pedidoConferindo.numero_sequencial} concluído! Estoque, financeiro e auditoria atualizados.`);
    setAbaAtiva('pedidos');
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Mensagem de Feedback */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Sub-navegação do Módulo de Compras */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setAbaAtiva('pedidos')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              abaAtiva === 'pedidos'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            Pedidos de Compra ({pedidosCompra.length})
          </button>
          <button
            onClick={() => setAbaAtiva('conferencia')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              abaAtiva === 'conferencia'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Conferência & Recebimento
          </button>
          <button
            onClick={() => setAbaAtiva('fornecedores')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              abaAtiva === 'fornecedores'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Fornecedores ({fornecedores.length})
          </button>
        </div>

        {abaAtiva === 'pedidos' && (
          <button
            onClick={() => setModalNovoPedido(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> + Novo Pedido de Compra
          </button>
        )}
      </div>

      {/* ABA 1: LISTAGEM DE PEDIDOS DE COMPRA */}
      {abaAtiva === 'pedidos' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-3">Nº Compra</th>
                  <th className="p-3">Fornecedor</th>
                  <th className="p-3">Emissão</th>
                  <th className="p-3">Previsão Entrega</th>
                  <th className="p-3 text-right">Valor Previsto</th>
                  <th className="p-3 text-right">Valor Realizado</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidosCompra.map((pc) => (
                  <tr key={pc.id} className="hover:bg-gray-50/70">
                    <td className="p-3 font-mono font-bold text-gray-900">
                      #{pc.numero_sequencial}
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      {pc.fornecedor_nome}
                      <span className="block text-[10px] text-gray-400 font-normal">
                        CNPJ: {pc.fornecedor_cnpj}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(pc.data_emissao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 text-gray-600 font-medium">
                      {new Date(pc.previsao_entrega).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 text-right font-black text-gray-900">
                      R$ {pc.valor_total_previsto.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-800">
                      {pc.valor_total_realizado > 0 ? `R$ ${pc.valor_total_realizado.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          pc.status === 'recebido'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pc.status === 'recebido_parcial'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : pc.status === 'pendente'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {pc.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {['pendente', 'recebido_parcial'].includes(pc.status) ? (
                        <button
                          onClick={() => handleSelecionarPedidoConferencia(pc)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <ClipboardCheck className="w-3 h-3" /> Fazer Conferência
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold">Concluído ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 2: TELA DE CONFERÊNCIA E RECEBIMENTO DE MERCADORIAS */}
      {abaAtiva === 'conferencia' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                Doca de Recebimento & Conferência Física
              </span>
              <h3 className="text-lg font-black text-gray-900 mt-1">
                Conferência do Pedido de Compra #{pedidoConferindo?.numero_sequencial || 'Selecione'}
              </h3>
              <p className="text-xs text-gray-500">
                Fornecedor: <strong>{pedidoConferindo?.fornecedor_nome}</strong> | CNPJ: {pedidoConferindo?.fornecedor_cnpj}
              </p>
            </div>

            {/* Seletor de outro pedido para conferir */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Trocar Pedido:</span>
              <select
                value={pedidoConferindo?.id || ''}
                onChange={(e) => {
                  const sel = pedidosCompra.find((p) => p.id === e.target.value);
                  if (sel) handleSelecionarPedidoConferencia(sel);
                }}
                className="bg-gray-50 border border-gray-300 rounded-xl py-1.5 px-3 text-xs text-gray-800 font-bold"
              >
                {pedidosCompra
                  .filter((p) => ['pendente', 'recebido_parcial'].includes(p.status))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.numero_sequencial} — {p.fornecedor_nome} ({p.status})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {!pedidoConferindo ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              Nenhum pedido pendente de recebimento selecionado.
            </div>
          ) : (
            <form onSubmit={handleConfirmarConferenciaSubmit} className="space-y-6">
              {/* Tabela de Itens para Conferência */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 font-black text-gray-700 text-xs border-b border-gray-200 flex justify-between">
                  <span>ITENS DA NOTA DO FORNECEDOR</span>
                  <span className="text-emerald-700 font-bold">
                    Entrada Líquida no Estoque = Qtd Recebida - Avaria
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-100/60 text-gray-600 border-b border-gray-200">
                        <th className="p-3">Produto</th>
                        <th className="p-3 text-center">Un.</th>
                        <th className="p-3 text-right">Qtd Pedida</th>
                        <th className="p-3 text-right">Já Entregue</th>
                        <th className="p-3 text-right">Saldo Restante</th>
                        <th className="p-3 text-right bg-blue-50/70 text-blue-900 font-black">
                          Qtd Recebida (Nesta Remessa) *
                        </th>
                        <th className="p-3 text-right bg-rose-50/70 text-rose-900 font-black">
                          Qtd com Avaria / Recusada
                        </th>
                        <th className="p-3 text-right bg-emerald-50 text-emerald-950 font-black">
                          Entrada Líquida Estoque
                        </th>
                        <th className="p-3">Motivo Divergência / Obs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pedidoConferindo.itens.map((it) => {
                        const conf = conferenciaItens[it.id] || {
                          qtdRecebida: it.quantidade_saldo_restante,
                          qtdAvaria: 0,
                          motivo: 'Entrega conforme NF do fornecedor',
                          obs: '',
                        };

                        const entradaLiquida = Math.max(0, conf.qtdRecebida - conf.qtdAvaria);

                        return (
                          <tr key={it.id} className="hover:bg-gray-50/60">
                            <td className="p-3">
                              <span className="font-extrabold text-gray-900 block">{it.produto_nome}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{it.sku}</span>
                            </td>
                            <td className="p-3 text-center font-bold text-gray-600">{it.unidade}</td>
                            <td className="p-3 text-right font-bold text-gray-500">
                              {it.quantidade_pedida}
                            </td>
                            <td className="p-3 text-right text-gray-500">
                              {it.quantidade_recebida_acumulada}
                            </td>
                            <td className="p-3 text-right font-black text-amber-700">
                              {it.quantidade_saldo_restante}
                            </td>

                            {/* Qtd Recebida nesta remessa (Editável) */}
                            <td className="p-3 text-right bg-blue-50/40">
                              <input
                                type="number"
                                min="0"
                                max={it.quantidade_saldo_restante}
                                required
                                value={conf.qtdRecebida}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setConferenciaItens((prev) => ({
                                    ...prev,
                                    [it.id]: { ...conf, qtdRecebida: val },
                                  }));
                                }}
                                className="w-20 bg-white border border-blue-400 rounded-lg p-1.5 text-right font-black text-blue-900 text-xs focus:ring-1 focus:ring-blue-600"
                              />
                            </td>

                            {/* Qtd Avaria / Recusada (Editável) */}
                            <td className="p-3 text-right bg-rose-50/40">
                              <input
                                type="number"
                                min="0"
                                max={conf.qtdRecebida}
                                value={conf.qtdAvaria}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setConferenciaItens((prev) => ({
                                    ...prev,
                                    [it.id]: { ...conf, qtdAvaria: val },
                                  }));
                                }}
                                className="w-20 bg-white border border-rose-300 rounded-lg p-1.5 text-right font-black text-rose-900 text-xs focus:ring-1 focus:ring-rose-600"
                              />
                            </td>

                            {/* Entrada Líquida que vai somar no estoque */}
                            <td className="p-3 text-right font-black text-emerald-800 bg-emerald-50/80 text-sm">
                              +{entradaLiquida} {it.unidade}
                            </td>

                            {/* Motivo de Divergência e Observações */}
                            <td className="p-3 space-y-1">
                              <select
                                value={conf.motivo}
                                onChange={(e) => {
                                  setConferenciaItens((prev) => ({
                                    ...prev,
                                    [it.id]: { ...conf, motivo: e.target.value },
                                  }));
                                }}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-1 text-[11px]"
                              >
                                <option value="Entrega conforme NF do fornecedor">Entrega conforme NF</option>
                                <option value="Falta de produto no caminhão">Falta de produto no caminhão</option>
                                <option value="Embalagem rasgada / danificada no transporte">Avaria no transporte</option>
                                <option value="Produto próximo do vencimento (Recusado)">Recusado: validade curta</option>
                                <option value="Entrega parcial acordada com fabricante">Entrega parcial acordada</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumo dos Efeitos ao Confirmar */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="font-black flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Efeitos automáticos ao confirmar o recebimento de mercadorias:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-emerald-900 font-medium text-[11px]">
                  <li>
                    <strong>Atualização de Estoque:</strong> O saldo líquido de cada produto será creditado imediatamente no sistema.
                  </li>
                  <li>
                    <strong>Módulo Financeiro:</strong> Geração do lançamento de despesa em <em>Compra de Mercadorias</em> e ajuste do valor a pagar na duplicata do fornecedor.
                  </li>
                  <li>
                    <strong>Status do Pedido:</strong> Se o saldo restante for zero, o pedido passará para <strong>Recebido</strong>; caso haja itens pendentes, permanecerá como <strong>Recebido Parcial</strong> para novas remessas.
                  </li>
                  <li>
                    <strong>Registro de Auditoria:</strong> Gravação permanente com usuário responsável, data, hora e motivo de qualquer divergência ou avaria.
                  </li>
                </ul>
              </div>

              {/* Botão de Finalização */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAbaAtiva('pedidos')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Voltar para Lista
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-6 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer text-xs"
                >
                  <FileCheck className="w-4 h-4" /> Confirmar Recebimento & Entrada de Estoque
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ABA 3: FORNECEDORES */}
      {abaAtiva === 'fornecedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fornecedores.map((forn) => (
            <div key={forn.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-400">CNPJ: {forn.cnpj}</span>
                  <h4 className="font-extrabold text-gray-900 text-sm mt-0.5">{forn.nome_fantasia}</h4>
                  <p className="text-[11px] text-gray-500">{forn.razao_social}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Parceiro Ativo
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 text-[10px] block">Cidade / UF:</span>
                  <strong>{forn.cidade} - {forn.uf}</strong>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Prazo Pagamento:</span>
                  <strong>{forn.prazo_pagamento_padrao_dias} dias</strong>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Telefone:</span>
                  <span>{forn.telefone}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">E-mail:</span>
                  <span className="truncate block">{forn.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NOVO PEDIDO DE COMPRA */}
      {modalNovoPedido && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-8">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Novo Pedido para Fornecedor</h3>
                <span className="text-[11px] text-emerald-200">
                  Adicione produtos com quantidade e preço de custo
                </span>
              </div>
              <button
                onClick={() => setModalNovoPedido(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovoPedido} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fornecedor */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Fornecedor *</label>
                  <select
                    value={fornecedorSelecionadoId}
                    onChange={(e) => setFornecedorSelecionadoId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
                  >
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome_fantasia} ({f.cidade}/{f.uf} — Prazo {f.prazo_pagamento_padrao_dias}d)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Previsão de Entrega */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Previsão de Entrega</label>
                  <input
                    type="date"
                    required
                    value={dataPrevisao}
                    onChange={(e) => setDataPrevisao(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
                  />
                </div>
              </div>

              {/* Lista de Itens do Pedido */}
              <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-gray-900 uppercase text-[11px]">
                    Produtos a Comprar
                  </span>
                  <button
                    type="button"
                    onClick={handleAdicionarItemForm}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Produto
                  </button>
                </div>

                <div className="space-y-2">
                  {itensNovoPedido.map((item, idx) => {
                    const subtotalItem = item.quantidade * item.precoCusto;
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                      >
                        <div className="sm:col-span-5">
                          <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Produto</label>
                          <select
                            value={item.produtoId}
                            onChange={(e) => {
                              const pId = e.target.value;
                              const p = produtos.find((pr) => pr.id === pId);
                              setItensNovoPedido((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? { ...it, produtoId: pId, precoCusto: p?.preco_custo || 5 }
                                    : it
                                )
                              );
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs text-gray-900 font-bold"
                          >
                            {produtos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} (Atual: {p.estoque} {p.unidade})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Qtd Pedida</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setItensNovoPedido((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, quantidade: val } : it))
                              );
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs text-right font-black text-gray-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Preço Custo (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.precoCusto}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setItensNovoPedido((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, precoCusto: val } : it))
                              );
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg p-1.5 text-xs text-right font-black text-gray-900"
                          />
                        </div>

                        <div className="sm:col-span-2 text-right">
                          <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Subtotal</label>
                          <strong className="text-gray-900 text-xs">
                            R$ {subtotalItem.toFixed(2)}
                          </strong>
                        </div>

                        <div className="sm:col-span-1 text-center">
                          {itensNovoPedido.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoverItemForm(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                              title="Remover"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financeiro: Gerar Conta a Pagar */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-black text-purple-950 text-xs">
                  <input
                    type="checkbox"
                    checked={gerarContaPagar}
                    onChange={(e) => setGerarContaPagar(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  Gerar automaticamente Provisão em &quot;Contas a Pagar&quot; com vencimento
                </label>

                {gerarContaPagar && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-purple-900 block mb-1">
                        Data de Vencimento da Fatura / Boleto
                      </label>
                      <input
                        type="date"
                        required
                        value={dataVencimento}
                        onChange={(e) => setDataVencimento(e.target.value)}
                        className="w-full bg-white border border-purple-300 rounded-xl p-2 text-xs text-purple-950 font-bold"
                      />
                    </div>
                    <div className="text-[11px] text-purple-800 leading-tight flex items-center">
                      💡 Ao receber a mercadoria na conferência física, o valor da duplicata será ajustado caso haja avarias.
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Observações do Pedido</label>
                <textarea
                  rows={2}
                  value={obsNovoPedido}
                  onChange={(e) => setObsNovoPedido(e.target.value)}
                  placeholder="Ex: Entrega na doca 2 no período da manhã..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
                />
              </div>

              {/* Botões */}
              <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoPedido(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-6 rounded-xl shadow-xs transition cursor-pointer text-xs"
                >
                  Confirmar e Gerar Pedido de Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
