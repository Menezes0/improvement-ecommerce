'use client';

import React, { useState, useMemo } from 'react';
import { LogAuditoria } from '@/types/database';
import {
  Clock,
  Search,
  Filter,
  ShieldCheck,
  User,
  Activity,
  Package,
  DollarSign,
  Truck,
  CheckCircle2,
} from 'lucide-react';

interface AdminAuditoriaProps {
  logs: LogAuditoria[];
}

export function AdminAuditoria({ logs }: AdminAuditoriaProps) {
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');

  const logsFiltrados = useMemo(() => {
    return logs.filter((l) => {
      const matchBusca =
        !busca ||
        l.acao.toLowerCase().includes(busca.toLowerCase()) ||
        l.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        l.usuario_nome.toLowerCase().includes(busca.toLowerCase());

      const matchTipo = tipoFiltro === 'todos' || l.tipo === tipoFiltro;

      return matchBusca && matchTipo;
    });
  }, [logs, busca, tipoFiltro]);

  return (
    <div className="space-y-5">
      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:w-auto min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ação, descrição ou usuário..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-emerald-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-500">Módulo:</span>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded-xl py-2 px-3 text-xs text-gray-800 font-bold"
          >
            <option value="todos">Todos os Eventos ({logs.length})</option>
            <option value="recebimento_compra">Recebimento de Compras</option>
            <option value="estoque">Ajustes de Estoque</option>
            <option value="preco">Alterações de Preço</option>
            <option value="financeiro">Ações Financeiras</option>
            <option value="pedido">Status de Pedidos</option>
            <option value="sistema">Sistema & Configurações</option>
          </select>
        </div>
      </div>

      {/* Linha do Tempo de Auditoria */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Trilha de Auditoria & Conformidade Regulatória (IFRO)
          </h3>
          <p className="text-[11px] text-gray-500">
            Registro imutável de todas as movimentações críticas da loja com identificação de autor, data, hora e justificativa.
          </p>
        </div>

        <div className="divide-y divide-gray-100 space-y-3 pt-1">
          {logsFiltrados.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              Nenhum registro de auditoria encontrado.
            </div>
          ) : (
            logsFiltrados.map((log) => (
              <div key={log.id} className="pt-3 first:pt-0 flex items-start gap-3.5 text-xs">
                <div className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                  {log.tipo === 'recebimento_compra' ? (
                    <Truck className="w-4 h-4 text-emerald-600" />
                  ) : log.tipo === 'financeiro' ? (
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  ) : log.tipo === 'estoque' ? (
                    <Package className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Activity className="w-4 h-4 text-blue-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-gray-900 font-extrabold">{log.acao}</strong>
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.2 rounded-full uppercase">
                        {log.tipo.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.criado_em).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-gray-700 mt-1 leading-snug">{log.descricao}</p>

                  {log.detalhes?.motivo && (
                    <div className="mt-1.5 p-2 bg-gray-50 rounded-lg text-[11px] text-gray-600 border border-gray-200">
                      <strong>Motivo registrado:</strong> {log.detalhes.motivo}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Responsável: <strong>{log.usuario_nome}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
