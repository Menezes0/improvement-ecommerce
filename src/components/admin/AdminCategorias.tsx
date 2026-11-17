'use client';

import React, { useState } from 'react';
import { Categoria } from '@/types/database';
import { Plus, Edit2, Check, X, ShieldAlert, Sparkles, FolderTree } from 'lucide-react';

interface AdminCategoriasProps {
  categorias: Categoria[];
  onSalvarCategoria: (categoria: Categoria) => void;
  onToggleCategoria: (categoriaId: string) => void;
}

export function AdminCategorias({
  categorias,
  onSalvarCategoria,
  onToggleCategoria,
}: AdminCategoriasProps) {
  const [modalAberta, setModalAberta] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ordem, setOrdem] = useState('1');
  const [aliquotaIcms, setAliquotaIcms] = useState<number>(12);
  const [iconeUrl, setIconeUrl] = useState('');
  const [ativa, setAtiva] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const handleAbrirNovo = () => {
    setCategoriaEditando(null);
    setNome('');
    setDescricao('');
    setOrdem(String(categorias.length + 1));
    setAliquotaIcms(12);
    setIconeUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80');
    setAtiva(true);
    setErro(null);
    setModalAberta(true);
  };

  const handleAbrirEdicao = (cat: Categoria) => {
    setCategoriaEditando(cat);
    setNome(cat.nome);
    setDescricao(cat.descricao || '');
    setOrdem(String(cat.ordem || 1));
    setAliquotaIcms(cat.aliquota_icms || 12);
    setIconeUrl(cat.icone_url || '');
    setAtiva(cat.ativa);
    setErro(null);
    setModalAberta(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome da categoria é obrigatório.');
      return;
    }

    const novaCat: Categoria = {
      id: categoriaEditando ? categoriaEditando.id : `cat-${Date.now()}`,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      ordem: parseInt(ordem, 10) || 1,
      aliquota_icms: aliquotaIcms,
      icone_url: iconeUrl.trim() || null,
      ativa,
    };

    onSalvarCategoria(novaCat);
    setModalAberta(false);
  };

  // Ordenar categorias por ordem de exibição
  const categoriasOrdenadas = [...categorias].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  return (
    <div className="space-y-5">
      {/* Barra de Ações */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-emerald-600" />
            Departamentos & Alíquotas Fiscais
          </h3>
          <p className="text-[11px] text-gray-500">
            A alíquota de ICMS configurada na categoria é aplicada automaticamente na emissão da Nota Fiscal dos produtos.
          </p>
        </div>

        <button
          onClick={handleAbrirNovo}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriasOrdenadas.map((cat) => (
          <div
            key={cat.id}
            className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between gap-3 transition ${
              cat.ativa ? 'border-gray-200' : 'border-gray-200 bg-gray-50/60 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                {cat.icone_url ? (
                  <img src={cat.icone_url} alt={cat.nome} className="w-full h-full object-cover" />
                ) : (
                  <FolderTree className="w-6 h-6 text-gray-400 m-auto mt-3" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400">Ordem #{cat.ordem || 1}</span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      cat.ativa ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {cat.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm truncate mt-0.5">{cat.nome}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-1">{cat.descricao || 'Sem descrição'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Alíquota ICMS:</span>
                <span className="font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs">
                  {cat.aliquota_icms}%
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAbrirEdicao(cat)}
                  className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                  title="Editar Categoria"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onToggleCategoria(cat.id)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                    cat.ativa
                      ? 'text-rose-700 hover:bg-rose-50'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {cat.ativa ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição de Categoria */}
      {modalAberta && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <h3 className="font-black text-base">
                {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={() => setModalAberta(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4 text-xs">
              {erro && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold">
                  {erro}
                </div>
              )}

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Laticínios e Frios"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descrição</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Queijos, leites e iogurtes"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    min="1"
                    value={ordem}
                    onChange={(e) => setOrdem(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-800 block mb-1">Alíquota ICMS (NF-e)</label>
                  <select
                    value={aliquotaIcms}
                    onChange={(e) => setAliquotaIcms(Number(e.target.value))}
                    className="w-full bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 text-xs text-emerald-950 font-black"
                  >
                    <option value={7}>7% (Hortifrúti / Cesta Básica)</option>
                    <option value={12}>12% (Padaria, Laticínios, Carnes, Dietas)</option>
                    <option value={18}>18% (Bebidas não alcoólicas, Limpeza, Higiene)</option>
                    <option value={25}>25% (Bebidas Alcoólicas)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">URL da Imagem / Banner</label>
                <input
                  type="url"
                  value={iconeUrl}
                  onChange={(e) => setIconeUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={ativa}
                    onChange={(e) => setAtiva(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  Categoria Ativa no E-commerce
                </label>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2 px-5 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
