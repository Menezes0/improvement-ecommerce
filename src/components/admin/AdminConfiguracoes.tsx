'use client';

import React, { useState } from 'react';
import { ZonaEntrega, ConfigLoja } from '@/types/database';
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  DollarSign,
  RefreshCcw,
  CheckCircle,
  Save,
} from 'lucide-react';

interface AdminConfiguracoesProps {
  configLoja: ConfigLoja;
  zonas: ZonaEntrega[];
  onSalvarConfigLoja: (config: ConfigLoja) => void;
  onAlterarTaxaBairro: (zonaId: string, novaTaxa: number) => void;
  onRestaurarDados: () => void;
  isRestaurando: boolean;
}

export function AdminConfiguracoes({
  configLoja,
  zonas,
  onSalvarConfigLoja,
  onAlterarTaxaBairro,
  onRestaurarDados,
  isRestaurando,
}: AdminConfiguracoesProps) {
  const [nomeLoja, setNomeLoja] = useState(configLoja.nome || 'Improvement Supermercados');
  const [razaoSocial, setRazaoSocial] = useState(configLoja.razao_social || 'Improvement Supermercados Ltda');
  const [cnpj, setCnpj] = useState(configLoja.cnpj || '12.345.678/0001-90');
  const [ie, setIe] = useState(configLoja.inscricao_estadual || '123.456.789');
  const [endereco, setEndereco] = useState(configLoja.endereco || 'Av. Calama, 4985 - Flodoaldo Pontes Pinto, Porto Velho - RO');
  const [telefone, setTelefone] = useState(configLoja.telefone || '(69) 3217-1000');
  const [email, setEmail] = useState(configLoja.email || 'sac@improvementsupermercados.com.br');
  const [horario, setHorario] = useState(configLoja.horario_funcionamento || 'Segunda a Sábado: 07:00 às 22:00 | Domingos: 07:00 às 18:00');
  const [raioAviso, setRaioAviso] = useState(configLoja.raio_aviso_m || 1000);
  const [salvoMsg, setSalvoMsg] = useState(false);

  const handleSalvarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarConfigLoja({
      ...configLoja,
      nome: nomeLoja,
      razao_social: razaoSocial,
      cnpj,
      inscricao_estadual: ie,
      endereco,
      telefone,
      email,
      horario_funcionamento: horario,
      raio_aviso_m: Number(raioAviso) || 1000,
    });
    setSalvoMsg(true);
    setTimeout(() => setSalvoMsg(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Botão de Restauração de Dados Simulados (RF25, CA33) */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[10px] font-black text-purple-200 bg-purple-800/60 px-2.5 py-0.5 rounded-full uppercase">
            Simulação Acadêmica IFRO (RF25, CA33)
          </span>
          <h3 className="font-black text-base mt-1">Restauração da Base Inicial</h3>
          <p className="text-xs text-purple-200 max-w-xl mt-0.5">
            Recarrega todo o catálogo comercial com 65+ produtos, 9 categorias com alíquotas fiscais, pedidos de compra e contas a pagar padrão.
          </p>
        </div>

        <button
          onClick={onRestaurarDados}
          disabled={isRestaurando}
          className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs py-3 px-5 rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isRestaurando ? 'animate-spin' : ''}`} />
          {isRestaurando ? 'Restaurando Base...' : 'Restaurar Dados Simulados (RF25)'}
        </button>
      </div>

      {salvoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Configurações gerais da loja salvas com sucesso!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Dados Cadastrais & Fiscais da Loja */}
        <form onSubmit={handleSalvarConfig} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              Dados Gerais & Fiscais do Supermercado
            </h3>
            <span className="text-[11px] text-gray-400">
              Esses dados constam no cabeçalho das Notas Fiscais e no rodapé do site
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">Nome Fantasia da Loja</label>
              <input
                type="text"
                value={nomeLoja}
                onChange={(e) => setNomeLoja(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Razão Social</label>
              <input
                type="text"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Inscrição Estadual (IE)</label>
              <input
                type="text"
                value={ie}
                onChange={(e) => setIe(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Telefone / SAC</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">Endereço Físico</label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-gray-700 block mb-1">Horário de Funcionamento</label>
              <input
                type="text"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
              />
            </div>

            <div>
              <label className="font-bold text-purple-900 block mb-1">
                Raio Aviso de Chegada (RF15)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={raioAviso}
                  onChange={(e) => setRaioAviso(parseInt(e.target.value, 10) || 1000)}
                  className="w-24 bg-purple-50 border border-purple-300 rounded-xl p-2 text-xs font-black text-purple-950"
                />
                <span className="text-gray-500 text-[11px]">metros (1.000m)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Save className="w-3.5 h-3.5" /> Salvar Configurações
            </button>
          </div>
        </form>

        {/* Zonas de Entrega e Taxas de Frete (RF24, CA32) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Zonas de Entrega e Taxas em Porto Velho (RF24)
            </h3>
            <span className="text-[11px] text-gray-400">
              Altere a taxa de frete de cada bairro em tempo real (Critério CA32)
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {zonas.map((z) => (
              <div
                key={z.id}
                className="p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-200"
              >
                <div>
                  <strong className="text-gray-900 block">{z.bairro}</strong>
                  <span className="text-[10px] text-gray-500">Prazo estimado: {z.prazo_estimado_min} min</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-[11px]">Taxa R$:</span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={z.taxa_frete}
                    onChange={(e) => onAlterarTaxaBairro(z.id, parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white border border-gray-300 font-extrabold text-emerald-800 rounded-lg px-2 py-1 text-right text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 font-medium">
            💡 <strong>Teste do Critério CA32:</strong> Altere a taxa de Olaria de R$ 6,00 para R$ 9,00 e veja o recálculo automático na sacola de compras!
          </div>
        </div>
      </div>
    </div>
  );
}
