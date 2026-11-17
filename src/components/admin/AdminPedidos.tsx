'use client';

import React, { useState, useMemo } from 'react';
import { Pedido, StatusPedido } from '@/types/database';
import {
  Package,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
  FileText,
  AlertTriangle,
  X,
  Edit3,
} from 'lucide-react';

interface AdminPedidosProps {
  pedidos: Pedido[];
  onAlterarStatus: (pedidoId: string, novoStatus: StatusPedido, motivo: string) => void;
  onVerNotaFiscal: (pedido: Pedido) => void;
}

export function AdminPedidos({
  pedidos,
  onAlterarStatus,
  onVerNotaFiscal,
}: AdminPedidosProps) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [pedidoDetalhe, setPedidoDetalhe] = useState<Pedido | null>(null);

  // Modal para alterar status com motivo
  const [modalAlterarStatus, setModalAlterarStatus] = useState<Pedido | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusPedido>('concluido');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const matchBusca =
        !busca ||
        p.id.toLowerCase().includes(busca.toLowerCase()) ||
        p.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) ||
        p.endereco?.bairro?.toLowerCase().includes(busca.toLowerCase());

      const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus;

      return matchBusca && matchStatus;
    });
  }, [pedidos, busca, filtroStatus]);

  const handleAbrirAlterarStatus = (p: Pedido) => {
    setModalAlterarStatus(p);
    setNovoStatus(p.status);
    setMotivoAlteracao('');
  };

  const handleConfirmarStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAlterarStatus) return;
    onAlterarStatus(modalAlterarStatus.id, novoStatus, motivoAlteracao.trim() || 'Alteração pelo administrador');
    setModalAlterarStatus(null);
  };

  return (
    <div className="space-y-5">
      {/* Filtros e Busca */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:w-auto min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Nº do pedido, cliente ou bairro..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-emerald-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-500">Status:</span>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl py-2 px-3 text-xs text-gray-800 font-bold"
          >
            <option value="todos">Todos os Pedidos ({pedidos.length})</option>
            <option value="recebido">Recebido</option>
            <option value="em_separacao">Em Separação</option>
            <option value="pronto">Pronto</option>
            <option value="saiu_para_entrega">Saiu para Entrega</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <th className="p-3">Nº Pedido</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Modalidade</th>
                <th className="p-3">Data / Hora</th>
                <th className="p-3 text-right">Subtotal</th>
                <th className="p-3 text-right">Frete</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70">
                    <td className="p-3 font-mono font-bold text-gray-700">
                      #{p.id.slice(0, 8)}
                    </td>
                    <td className="p-3">
                      <strong className="text-gray-900 block">{p.cliente_nome || 'Cliente'}</strong>
                      <span className="text-[10px] text-gray-400">{p.cliente_email}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.tipo === 'entrega' ? 'bg-blue-50 text-blue-800' : 'bg-purple-50 text-purple-800'
                        }`}
                      >
                        {p.tipo === 'entrega' ? `Entrega (${p.endereco?.bairro || 'PVH'})` : 'Clique & Retire'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 font-mono">
                      {new Date(p.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-right text-gray-600">
                      R$ {p.subtotal.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-gray-600">
                      R$ {p.frete.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-800 text-sm">
                      R$ {p.total.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          p.status === 'concluido'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'cancelado'
                            ? 'bg-rose-100 text-rose-800'
                            : p.status === 'pronto'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPedidoDetalhe(p)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-lg transition"
                          title="Ver Detalhes do Pedido"
                        >
                          Itens
                        </button>
                        <button
                          onClick={() => handleAbrirAlterarStatus(p)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          title="Alterar Status com Motivo"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-600" /> Status
                        </button>
                        <button
                          onClick={() => onVerNotaFiscal(p)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                          title="Abrir Nota Fiscal Eletrônica"
                        >
                          <FileText className="w-3 h-3" /> NF-e
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DETALHES DOS ITENS DO PEDIDO */}
      {pedidoDetalhe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm">
                  Detalhes do Pedido #{pedidoDetalhe.id.slice(0, 10)}
                </h3>
                <span className="text-[11px] text-gray-300">
                  Cliente: {pedidoDetalhe.cliente_nome} ({pedidoDetalhe.cliente_email})
                </span>
              </div>
              <button onClick={() => setPedidoDetalhe(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-center">Qtd</th>
                      <th className="p-2.5 text-right">Unitário</th>
                      <th className="p-2.5 text-right">Subtotal</th>
                      <th className="p-2.5 text-center">Substituição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(pedidoDetalhe.itens || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-gray-900">
                          {it.produto?.nome || 'Item do pedido'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-gray-700">{it.quantidade}</td>
                        <td className="p-2.5 text-right text-gray-600">
                          R$ {it.preco_unitario.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-black text-gray-950">
                          R$ {(it.quantidade * it.preco_unitario).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="text-[10px] text-gray-500 font-medium">
                            {it.regra_substituicao === 'troca_marca' ? 'Troca de Marca' : 'Não Substituir'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-center text-xs">
                <span>Subtotal: R$ {pedidoDetalhe.subtotal.toFixed(2)} | Frete: R$ {pedidoDetalhe.frete.toFixed(2)}</span>
                <strong className="text-emerald-800 text-sm font-black">
                  Total: R$ {pedidoDetalhe.total.toFixed(2)}
                </strong>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setPedidoDetalhe(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALTERAR STATUS COM MOTIVO (AUDITORIA) */}
      {modalAlterarStatus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Alterar Status do Pedido</h3>
                <span className="text-[11px] text-emerald-200">
                  Pedido #{modalAlterarStatus.id.slice(0, 10)}
                </span>
              </div>
              <button onClick={() => setModalAlterarStatus(null)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Novo Status *</label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as StatusPedido)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
                >
                  <option value="recebido">Recebido</option>
                  <option value="em_separacao">Em Separação</option>
                  <option value="pronto">Pronto</option>
                  <option value="saiu_para_entrega">Saiu para Entrega</option>
                  <option value="concluido">Concluído (Finalizado)</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Motivo da Alteração * (Registrado em Auditoria)
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoAlteracao}
                  onChange={(e) => setMotivoAlteracao(e.target.value)}
                  placeholder="Ex: Cliente solicitou adiantamento da entrega / Separação física finalizada com sucesso..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAlterarStatus(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-6 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Confirmar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
