'use client';

import React from 'react';
import { NotaFiscal } from '@/types/database';
import { X, Printer, Download, ShieldCheck, QrCode } from 'lucide-react';

interface NotaFiscalModalProps {
  nota: NotaFiscal | null;
  onClose: () => void;
}

export function NotaFiscalModal({ nota, onClose }: NotaFiscalModalProps) {
  if (!nota) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const chaveFormatada = nota.chave_acesso.replace(/(\d{4})/g, '$1 ').trim();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Barra superior de ações */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              NF-e Eletrônica Simulada (IFRO)
            </span>
            <span className="text-xs text-gray-300">
              Série {nota.serie} — Nº {String(nota.numero_nfe).padStart(6, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível do Documento Auxiliar da Nota Fiscal (DANFE) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-gray-900 text-xs font-sans print:p-0 print:text-[10px]">
          {/* Cabeçalho Fiscal */}
          <div className="border-2 border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-emerald-800 tracking-tight">
                  {nota.emitente_razao_social}
                </span>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded">
                  MODELO 55
                </span>
              </div>
              <p className="text-gray-600 leading-snug">{nota.emitente_endereco}</p>
              <div className="flex flex-wrap gap-x-4 text-gray-700 font-semibold pt-1">
                <span>CNPJ: <strong>{nota.emitente_cnpj}</strong></span>
                <span>Inscrição Estadual: <strong>{nota.emitente_ie}</strong></span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded-xl p-3 text-center md:text-right w-full md:w-auto">
              <div className="text-[11px] font-black uppercase text-gray-800">
                DANFE — Documento Auxiliar
              </div>
              <div className="text-xl font-black text-gray-950">
                Nº {String(nota.numero_nfe).padStart(6, '0')}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                Série {nota.serie} | Folha 1/1
              </div>
              <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center justify-center md:justify-end gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                AUTORIZADA SEFAZ/RO
              </div>
            </div>
          </div>

          {/* Chave de Acesso Oficial (44 Dígitos) */}
          <div className="bg-gray-50 border border-gray-300 rounded-xl p-3 text-center space-y-1">
            <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider">
              Chave de Acesso para Consulta de Autenticidade (SEFAZ-RO)
            </div>
            <div className="font-mono text-sm sm:text-base font-bold text-gray-900 tracking-widest break-all select-all">
              {chaveFormatada}
            </div>
          </div>

          {/* Dados da Operação e Destinatário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-300 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                Natureza da Operação
              </span>
              <div className="font-bold text-gray-900 text-xs">
                {nota.natureza_operacao}
              </div>
              <div className="text-[11px] text-gray-600 flex gap-4 pt-1">
                <span>CFOP: <strong>{nota.cfop_padrao}</strong></span>
                <span>Emissão: <strong>{new Date(nota.data_emissao).toLocaleString('pt-BR')}</strong></span>
              </div>
            </div>

            <div className="border border-gray-300 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                Destinatário / Consumidor
              </span>
              <div className="font-bold text-gray-900 text-xs">
                {nota.destinatario_nome}
              </div>
              <p className="text-[11px] text-gray-600">{nota.destinatario_endereco}</p>
              <div className="text-[11px] text-gray-600 font-medium">
                CPF: <strong>{nota.destinatario_cpf}</strong>
              </div>
            </div>
          </div>

          {/* Tabela de Produtos / Serviços com Alíquota por Categoria */}
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            <div className="bg-gray-100 px-3 py-2 font-bold text-gray-800 border-b border-gray-300 flex justify-between items-center text-[11px]">
              <span>DADOS DOS PRODUTOS / SERVIÇOS & TRIBUTAÇÃO INDIVIDUAL</span>
              <span className="text-gray-500 text-[10px]">Alíquota ICMS por Categoria</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <th className="p-2 text-center w-8">#</th>
                    <th className="p-2">Cód. SKU</th>
                    <th className="p-2">Descrição do Produto</th>
                    <th className="p-2">NCM</th>
                    <th className="p-2">CFOP</th>
                    <th className="p-2 text-center">Un.</th>
                    <th className="p-2 text-right">Qtd</th>
                    <th className="p-2 text-right">Vlr. Unit</th>
                    <th className="p-2 text-right">Vlr. Total</th>
                    <th className="p-2 text-center bg-emerald-50/50">ICMS %</th>
                    <th className="p-2 text-right bg-emerald-50/50">Vlr. ICMS</th>
                    <th className="p-2 text-right">PIS (1,65%)</th>
                    <th className="p-2 text-right">COFINS (7,6%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {nota.itens.map((it) => (
                    <tr key={it.id} className="hover:bg-gray-50/80">
                      <td className="p-2 text-center text-gray-400 font-mono">{it.numero_item}</td>
                      <td className="p-2 font-mono text-[10px] text-gray-600">{it.sku}</td>
                      <td className="p-2 font-bold text-gray-900">
                        {it.descricao}
                        <span className="block text-[9px] text-gray-500 font-normal">
                          {it.categoria_nome}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-[10px] text-gray-600">{it.ncm}</td>
                      <td className="p-2 font-mono text-[10px] text-gray-600">{it.cfop}</td>
                      <td className="p-2 text-center font-bold text-gray-700">{it.unidade}</td>
                      <td className="p-2 text-right font-bold text-gray-900">{it.quantidade}</td>
                      <td className="p-2 text-right text-gray-700">R$ {it.valor_unitario.toFixed(2)}</td>
                      <td className="p-2 text-right font-black text-gray-950">R$ {it.valor_total_bruto.toFixed(2)}</td>
                      <td className="p-2 text-center font-black text-emerald-800 bg-emerald-50/50">
                        {it.aliquota_icms}%
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-900 bg-emerald-50/50">
                        R$ {it.valor_icms.toFixed(2)}
                      </td>
                      <td className="p-2 text-right text-gray-600">R$ {it.valor_pis.toFixed(2)}</td>
                      <td className="p-2 text-right text-gray-600">R$ {it.valor_cofins.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quadro de Cálculo do Imposto (Totais) */}
          <div className="border border-gray-300 rounded-xl overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 font-bold text-gray-800 border-b border-gray-300 text-[11px]">
              CÁLCULO DO IMPOSTO & CONSOLIDAÇÃO TRIBUTÁRIA
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-gray-200 text-center">
              <div className="p-2.5">
                <span className="text-[10px] text-gray-500 block uppercase">Base Cálculo ICMS</span>
                <strong className="text-gray-900 text-xs">R$ {nota.base_calculo_icms.toFixed(2)}</strong>
              </div>
              <div className="p-2.5 bg-emerald-50/50">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">Valor do ICMS</span>
                <strong className="text-emerald-900 text-xs">R$ {nota.valor_total_icms.toFixed(2)}</strong>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-gray-500 block uppercase">Valor do PIS (1,65%)</span>
                <strong className="text-gray-900 text-xs">R$ {nota.valor_pis.toFixed(2)}</strong>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-gray-500 block uppercase">Valor COFINS (7,60%)</span>
                <strong className="text-gray-900 text-xs">R$ {nota.valor_cofins.toFixed(2)}</strong>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-gray-500 block uppercase">Valor do Frete</span>
                <strong className="text-gray-900 text-xs">R$ {nota.valor_frete.toFixed(2)}</strong>
              </div>
              <div className="p-2.5 bg-emerald-100/60">
                <span className="text-[10px] text-emerald-900 block uppercase font-black">VALOR TOTAL NOTA</span>
                <strong className="text-emerald-950 text-sm font-black">R$ {nota.valor_total_nota.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Rodapé Fiscal: Forma de Pagamento, QR Code e Legislação */}
          <div className="border border-gray-300 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-5 bg-gray-50">
            <div className="space-y-2 flex-1">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Forma de Pagamento</span>
                <span className="font-extrabold text-gray-900 text-xs">{nota.forma_pagamento}</span>
              </div>
              <div className="text-[11px] text-gray-700 leading-relaxed">
                <strong>Valor aproximado dos tributos federais e estaduais:</strong> R$ {nota.valor_tributos_aproximados.toFixed(2)} (27,50% conf. Lei 12.741/2012 — De Olho no Imposto).
              </div>
              <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-[10px] font-bold">
                🎓 {nota.observacao_legal}
              </div>
            </div>

            {/* QR Code Simulado Fictício */}
            <div className="flex flex-col items-center text-center shrink-0 p-3 bg-white border border-gray-300 rounded-2xl shadow-xs">
              <div className="w-24 h-24 bg-gray-900 rounded-xl flex items-center justify-center p-2 text-white">
                {/* Visualizador vetorial simulado de QR Code de alta fidelidade */}
                <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                  <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                  <rect x="5" y="5" width="20" height="20" fill="black" />
                  <rect x="10" y="10" width="10" height="10" fill="currentColor" />
                  <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                  <rect x="75" y="5" width="20" height="20" fill="black" />
                  <rect x="80" y="10" width="10" height="10" fill="currentColor" />
                  <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                  <rect x="5" y="75" width="20" height="20" fill="black" />
                  <rect x="10" y="80" width="10" height="10" fill="currentColor" />
                  <rect x="40" y="10" width="10" height="20" fill="currentColor" />
                  <rect x="45" y="35" width="20" height="10" fill="currentColor" />
                  <rect x="35" y="50" width="10" height="25" fill="currentColor" />
                  <rect x="60" y="55" width="25" height="10" fill="currentColor" />
                  <rect x="70" y="75" width="15" height="15" fill="currentColor" />
                  <rect x="50" y="80" width="10" height="10" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[9px] font-black text-gray-500 uppercase mt-1">Consulte via QR Code</span>
              <span className="text-[8px] text-emerald-700 font-bold">SEFAZ Rondônia</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
