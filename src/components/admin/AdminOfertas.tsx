'use client';

import React, { useState } from 'react';
import { Oferta, Produto } from '@/types/database';
import { Flame, Plus, Calendar, Edit2, Trash2, Check, X, Tag, DollarSign, Percent } from 'lucide-react';

interface AdminOfertasProps {
  ofertas: Oferta[];
  produtos: Produto[];
  onSalvarOferta: (oferta: Oferta) => void;
  onToggleOferta: (ofertaId: string) => void;
}

export function AdminOfertas({
  ofertas,
  produtos,
  onSalvarOferta,
  onToggleOferta,
}: AdminOfertasProps) {
  const [modalAberta, setModalAberta] = useState(false);
  const [ofertaEditando, setOfertaEditando] = useState<Oferta | null>(null);

  const [produtoId, setProdutoId] = useState(produtos[0]?.id || '');
  const [tipoDesconto, setTipoDesconto] = useState<'percentual' | 'fixo'>('percentual');
  const [valorDesconto, setValorDesconto] = useState('15'); // 15% ou R$ 5
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [destaqueMural, setDestaqueMural] = useState(true);
  const [ativa, setAtiva] = useState(true);

  const handleAbrirNovo = () => {
    setOfertaEditando(null);
    setProdutoId(produtos[0]?.id || '');
    setTipoDesconto('percentual');
    setValorDesconto('15');
    setDataInicio(new Date().toISOString().slice(0, 10));
    setDataFim(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setDestaqueMural(true);
    setAtiva(true);
    setModalAberta(true);
  };

  const handleAbrirEdicao = (of: Oferta) => {
    setOfertaEditando(of);
    setProdutoId(of.produto_id);
    setTipoDesconto(of.tipo_desconto || 'percentual');
    setValorDesconto(String(of.valor_desconto || 15));
    setDataInicio(of.inicio.slice(0, 10));
    setDataFim(of.fim.slice(0, 10));
    setDestaqueMural(Boolean(of.destaque_mural));
    setAtiva(of.ativa);
    setModalAberta(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = produtos.find((p) => p.id === produtoId);
    if (!prod) return;

    const descVal = parseFloat(valorDesconto) || 0;
    let precoPromo = prod.preco;

    if (tipoDesconto === 'percentual') {
      precoPromo = prod.preco * (1 - descVal / 100);
    } else {
      precoPromo = Math.max(0.1, prod.preco - descVal);
    }
    precoPromo = Number(precoPromo.toFixed(2));

    const nova: Oferta = {
      id: ofertaEditando ? ofertaEditando.id : `of-${Date.now()}`,
      produto_id: produtoId,
      tipo_desconto: tipoDesconto,
      valor_desconto: descVal,
      preco_original: prod.preco,
      preco_promocional: precoPromo,
      inicio: new Date(dataInicio).toISOString(),
      fim: new Date(dataFim).toISOString(),
      destaque_mural: destaqueMural,
      ativa,
      produto: prod,
    };

    onSalvarOferta(nova);
    setModalAberta(false);
  };

  return (
    <div className="space-y-5">
      {/* Barra de Ações */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Mural de Ofertas & Promoções
          </h3>
          <p className="text-[11px] text-gray-500">
            Produtos em oferta ativa exibem o preço promocional com o preço original riscado no frontend.
          </p>
        </div>

        <button
          onClick={handleAbrirNovo}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Criar Oferta
        </button>
      </div>

      {/* Grid de Ofertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ofertas.map((of) => {
          const prod = produtos.find((p) => p.id === of.produto_id) || of.produto;
          const precoOrig = of.preco_original || prod?.preco || of.preco_promocional * 1.25;
          const pctDesconto = Math.round(((precoOrig - of.preco_promocional) / precoOrig) * 100);

          return (
            <div
              key={of.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 ${
                of.ativa ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 relative">
                  {prod?.imagem_url ? (
                    <img src={prod.imagem_url} alt={prod.nome} className="w-full h-full object-cover" />
                  ) : (
                    <Tag className="w-6 h-6 text-gray-400 m-auto mt-4" />
                  )}
                  {pctDesconto > 0 && (
                    <span className="absolute top-1 left-1 bg-rose-600 text-white font-black text-[9px] px-1 rounded">
                      -{pctDesconto}%
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-orange-600 uppercase">
                      {of.destaque_mural ? '🔥 Destaque Mural' : 'Oferta Simples'}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        of.ativa ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {of.ativa ? 'Ativa' : 'Pausada'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-xs truncate mt-0.5">{prod?.nome || 'Produto'}</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-gray-400 line-through text-xs">
                      R$ {precoOrig.toFixed(2)}
                    </span>
                    <strong className="text-emerald-800 text-base font-black">
                      R$ {of.preco_promocional.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="text-[10px] text-gray-500 font-medium">
                  {new Date(of.inicio).toLocaleDateString('pt-BR')} até {new Date(of.fim).toLocaleDateString('pt-BR')}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAbrirEdicao(of)}
                    className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-lg"
                    title="Editar Oferta"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleOferta(of.id)}
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition ${
                      of.ativa ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {of.ativa ? 'Pausar' : 'Ativar'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: CRIAR / EDITAR OFERTA */}
      {modalAberta && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-orange-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">
                  {ofertaEditando ? 'Editar Oferta' : 'Criar Nova Oferta'}
                </h3>
                <span className="text-[11px] text-orange-100">
                  Defina o desconto e o período da campanha promocional
                </span>
              </div>
              <button onClick={() => setModalAberta(false)} className="text-orange-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Selecione o Produto *</label>
                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — R$ {p.preco.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipo de Desconto</label>
                  <select
                    value={tipoDesconto}
                    onChange={(e) => setTipoDesconto(e.target.value as 'percentual' | 'fixo')}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Valor do Desconto *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={valorDesconto}
                    onChange={(e) => setValorDesconto(e.target.value)}
                    placeholder={tipoDesconto === 'percentual' ? '15%' : 'R$ 2.00'}
                    className="w-full bg-white border border-orange-400 rounded-xl p-2.5 text-xs font-black text-orange-900 text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Data Início</label>
                  <input
                    type="date"
                    required
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-gray-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Data Fim</label>
                  <input
                    type="date"
                    required
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2 text-xs text-gray-900 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2 bg-orange-50 p-3 rounded-2xl border border-orange-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-orange-950">
                  <input
                    type="checkbox"
                    checked={destaqueMural}
                    onChange={(e) => setDestaqueMural(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  Destacar no Mural da Página Inicial
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-black text-orange-950">
                  <input
                    type="checkbox"
                    checked={ativa}
                    onChange={(e) => setAtiva(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  Oferta Ativa Imediatamente
                </label>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black py-2.5 px-6 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Salvar Oferta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
