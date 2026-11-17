'use client';

import React, { useState, useMemo } from 'react';
import { NotaFiscal } from '@/types/database';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Printer,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface AdminFiscalProps {
  notasFiscais: NotaFiscal[];
  onVisualizarNota: (nota: NotaFiscal) => void;
}

export function AdminFiscal({
  notasFiscais,
  onVisualizarNota,
}: AdminFiscalProps) {
  const [busca, setBusca] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');

  const notasFiltradas = useMemo(() => {
    return notasFiscais.filter((nf) => {
      const matchBusca =
        !busca ||
        String(nf.numero_nfe).includes(busca) ||
        nf.destinatario_nome.toLowerCase().includes(busca.toLowerCase()) ||
        nf.chave_acesso.includes(busca);

      return matchBusca;
    });
  }, [notasFiscais, busca]);

  const totalEmitido = notasFiltradas.reduce((acc, nf) => acc + nf.valor_total_nota, 0);
  const totalIcms = notasFiltradas.reduce((acc, nf) => acc + nf.valor_total_icms, 0);

  return (
    <div className="space-y-5">
      {/* Cards de Resumo Fiscal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase block">Total de NF-e Emitidas</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{notasFiscais.length}</div>
          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Autorizadas na SEFAZ-RO (Simulado)
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase block">Volume Faturado em Notas</span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            R$ {totalEmitido.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[10px] text-gray-400 block mt-1">Valor Total dos Documentos</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase block">ICMS Apurado das Notas</span>
          <div className="text-2xl font-black text-purple-900 mt-1">
            R$ {totalIcms.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[10px] text-purple-700 font-bold block mt-1">
            Conforme alíquotas (7%, 12%, 18%, 25%)
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 w-full sm:w-auto min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número da NF, cliente ou chave de acesso..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-emerald-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-500">Natureza Padrão:</span>
          <span className="bg-gray-100 font-mono text-[11px] font-bold px-2 py-1 rounded-lg text-gray-700">
            CFOP 5.102 (Venda Mercadorias)
          </span>
        </div>
      </div>

      {/* Tabela de Notas Fiscais Emitidas */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <th className="p-3">Nº NF-e</th>
                <th className="p-3">Série</th>
                <th className="p-3">Data / Hora Emissão</th>
                <th className="p-3">Destinatário</th>
                <th className="p-3">Chave de Acesso (44 dígitos)</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3 text-right">ICMS</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">DANFE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    Nenhuma nota fiscal encontrada.
                  </td>
                </tr>
              ) : (
                notasFiltradas.map((nf) => {
                  const chaveResumida = `${nf.chave_acesso.slice(0, 4)}...${nf.chave_acesso.slice(-4)}`;

                  return (
                    <tr key={nf.id} className="hover:bg-gray-50/70">
                      <td className="p-3 font-mono font-black text-gray-950">
                        #{String(nf.numero_nfe).padStart(6, '0')}
                      </td>
                      <td className="p-3 font-mono text-gray-500">{nf.serie}</td>
                      <td className="p-3 text-gray-600">
                        {new Date(nf.data_emissao).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 font-bold text-gray-900">{nf.destinatario_nome}</td>
                      <td className="p-3 font-mono text-[11px] text-gray-500" title={nf.chave_acesso}>
                        {chaveResumida}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-800 text-sm">
                        R$ {nf.valor_total_nota.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-purple-900">
                        R$ {nf.valor_total_icms.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Autorizada
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onVisualizarNota(nf)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> Abrir DANFE
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
