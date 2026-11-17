'use client';

import React, { useState, useMemo } from 'react';
import { Produto, Categoria, UnidadeMedida } from '@/types/database';
import {
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Package,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';

interface AdminProdutosProps {
  produtos: Produto[];
  categorias: Categoria[];
  onSalvarProduto: (produto: Produto) => void;
  onToggleStatus: (produtoId: string) => void;
}

export function AdminProdutos({
  produtos,
  categorias,
  onSalvarProduto,
  onToggleStatus,
}: AdminProdutosProps) {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Estado para Modal de Criação / Edição
  const [modalAberta, setModalAberta] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || '');
  const [sku, setSku] = useState('');
  const [unidade, setUnidade] = useState<UnidadeMedida>('UN');
  const [precoVenda, setPrecoVenda] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [estoque, setEstoque] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('10');
  const [ncm, setNcm] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [semLactose, setSemLactose] = useState(false);
  const [semGluten, setSemGluten] = useState(false);
  const [vegano, setVegano] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Abrir Modal para Criar Novo
  const handleAbrirNovo = () => {
    setProdutoEditando(null);
    setNome('');
    setMarca('');
    setDescricao('');
    setCategoriaId(categorias[0]?.id || '');
    setSku(`SKU-${String(Math.floor(1000 + Math.random() * 9000))}`);
    setUnidade('UN');
    setPrecoVenda('');
    setPrecoCusto('');
    setEstoque('20');
    setEstoqueMinimo('10');
    setNcm('2106.90.90');
    setImagemUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80');
    setSemLactose(false);
    setSemGluten(false);
    setVegano(false);
    setAtivo(true);
    setErroForm(null);
    setModalAberta(true);
  };

  // Abrir Modal para Editar
  const handleAbrirEdicao = (prod: Produto) => {
    setProdutoEditando(prod);
    setNome(prod.nome);
    setMarca(prod.marca || '');
    setDescricao(prod.descricao || '');
    setCategoriaId(prod.categoria_id);
    setSku(prod.sku || `SKU-${prod.id.slice(-5)}`);
    setUnidade(prod.unidade || 'UN');
    setPrecoVenda(String(prod.preco));
    setPrecoCusto(String(prod.preco_custo || (prod.preco * 0.7).toFixed(2)));
    setEstoque(String(prod.estoque));
    setEstoqueMinimo(String(prod.estoque_minimo || 10));
    setNcm(prod.ncm || '2106.90.90');
    setImagemUrl(prod.imagem_url || '');
    setSemLactose(Boolean(prod.sem_lactose));
    setSemGluten(Boolean(prod.sem_gluten));
    setVegano(Boolean(prod.vegano));
    setAtivo(prod.ativo);
    setErroForm(null);
    setModalAberta(true);
  };

  // Salvar Produto (com validação estrita de preço de custo obrigatório)
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    const pv = parseFloat(precoVenda);
    const pc = parseFloat(precoCusto);
    const est = parseInt(estoque, 10);
    const estMin = parseInt(estoqueMinimo, 10);

    if (!nome.trim()) {
      setErroForm('O nome do produto é obrigatório.');
      return;
    }
    if (isNaN(pv) || pv <= 0) {
      setErroForm('O preço de venda deve ser maior que zero.');
      return;
    }
    if (isNaN(pc) || pc <= 0) {
      setErroForm('O preço de custo é OBRIGATÓRIO para cálculo de margem e compras.');
      return;
    }
    if (isNaN(est) || est < 0) {
      setErroForm('O estoque não pode ser negativo.');
      return;
    }

    const cat = categorias.find((c) => c.id === categoriaId);
    const margem = Number((((pv - pc) / pv) * 100).toFixed(1));

    const novoProduto: Produto = {
      id: produtoEditando ? produtoEditando.id : `prod-${Date.now()}`,
      nome: nome.trim(),
      marca: marca.trim() || 'Marca Própria',
      descricao: descricao.trim() || null,
      categoria_id: categoriaId,
      categoria_nome: cat?.nome || 'Mercearia Básica',
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      unidade,
      preco: pv,
      preco_custo: pc,
      margem_lucro_percentual: margem,
      estoque: est,
      estoque_minimo: isNaN(estMin) ? 10 : estMin,
      ncm: ncm.trim() || '2106.90.90',
      imagem_url: imagemUrl.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      sem_lactose: semLactose,
      sem_gluten: semGluten,
      vegano: vegano,
      ativo: ativo,
      atualizado_em: new Date().toISOString(),
    };

    onSalvarProduto(novoProduto);
    setModalAberta(false);
  };

  // Filtragem de Produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      // Busca por nome, marca ou SKU
      const matchBusca =
        !busca ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.marca?.toLowerCase().includes(busca.toLowerCase()) ||
        p.sku?.toLowerCase().includes(busca.toLowerCase());

      // Categoria
      const matchCategoria =
        categoriaFiltro === 'todas' || p.categoria_id === categoriaFiltro;

      // Status
      const matchStatus =
        statusFiltro === 'todos' ||
        (statusFiltro === 'ativos' && p.ativo) ||
        (statusFiltro === 'inativos' && !p.ativo);

      // Estoque Baixo
      const matchEstoque = !apenasEstoqueBaixo || p.estoque <= (p.estoque_minimo || 10);

      return matchBusca && matchCategoria && matchStatus && matchEstoque;
    });
  }, [produtos, busca, categoriaFiltro, statusFiltro, apenasEstoqueBaixo]);

  // Paginação
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina) || 1;
  const produtosPaginados = produtosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  return (
    <div className="space-y-5">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, marca ou SKU..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-emerald-600 font-medium"
            />
          </div>

          {/* Filtro por Categoria */}
          <select
            value={categoriaFiltro}
            onChange={(e) => {
              setCategoriaFiltro(e.target.value);
              setPaginaAtual(1);
            }}
            className="bg-gray-50 border border-gray-300 rounded-xl py-2 px-3 text-xs text-gray-800 font-medium"
          >
            <option value="todas">Todas as Categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={statusFiltro}
            onChange={(e) => {
              setStatusFiltro(e.target.value as 'todos' | 'ativos' | 'inativos');
              setPaginaAtual(1);
            }}
            className="bg-gray-50 border border-gray-300 rounded-xl py-2 px-3 text-xs text-gray-800 font-medium"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativos">Somente Ativos</option>
            <option value="inativos">Somente Inativos (Soft Delete)</option>
          </select>

          {/* Botão de Estoque Baixo */}
          <button
            onClick={() => {
              setApenasEstoqueBaixo(!apenasEstoqueBaixo);
              setPaginaAtual(1);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              apenasEstoqueBaixo
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Estoque Baixo
          </button>
        </div>

        {/* Botão Novo Produto */}
        <button
          onClick={handleAbrirNovo}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Cadastrar Produto
        </button>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <th className="p-3 w-14 text-center">Foto</th>
                <th className="p-3">Produto / Marca</th>
                <th className="p-3">SKU / Categoria</th>
                <th className="p-3 text-right">Preço Venda</th>
                <th className="p-3 text-right">Preço Custo</th>
                <th className="p-3 text-center">Margem %</th>
                <th className="p-3 text-center">Estoque</th>
                <th className="p-3 text-center">Classificação</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produtosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                produtosPaginados.map((prod) => {
                  const pc = prod.preco_custo || Number((prod.preco * 0.7).toFixed(2));
                  const margem = prod.margem_lucro_percentual ?? Number((((prod.preco - pc) / prod.preco) * 100).toFixed(1));
                  const estoqueBaixo = prod.estoque <= (prod.estoque_minimo || 10);

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-gray-50/80 transition ${!prod.ativo ? 'opacity-60 bg-gray-50/40' : ''}`}
                    >
                      {/* Foto */}
                      <td className="p-3 text-center">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 relative mx-auto shrink-0">
                          {prod.imagem_url ? (
                            <img
                              src={prod.imagem_url}
                              alt={prod.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400 m-auto mt-2.5" />
                          )}
                        </div>
                      </td>

                      {/* Nome e Marca */}
                      <td className="p-3">
                        <div className="font-extrabold text-gray-900 leading-snug">
                          {prod.nome}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium">
                          Marca: {prod.marca || 'Própria'}
                        </div>
                      </td>

                      {/* SKU e Categoria */}
                      <td className="p-3">
                        <div className="font-mono text-[11px] font-bold text-gray-600">
                          {prod.sku || `SKU-${prod.id.slice(-5)}`}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-semibold">
                          {prod.categoria_nome || 'Geral'}
                        </div>
                      </td>

                      {/* Preço de Venda */}
                      <td className="p-3 text-right font-black text-gray-950">
                        R$ {prod.preco.toFixed(2)}
                      </td>

                      {/* Preço de Custo */}
                      <td className="p-3 text-right font-bold text-gray-600">
                        R$ {pc.toFixed(2)}
                      </td>

                      {/* Margem */}
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          margem >= 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {margem}%
                        </span>
                      </td>

                      {/* Estoque */}
                      <td className="p-3 text-center">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-lg inline-flex items-center gap-1 ${
                            estoqueBaixo
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {estoqueBaixo && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {prod.estoque} {prod.unidade || 'UN'}
                        </span>
                      </td>

                      {/* Classificações Dietéticas */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {prod.vegano && (
                            <span className="text-[9px] font-bold bg-green-100 text-green-800 px-1.5 py-0.2 rounded" title="Vegano">
                              VG
                            </span>
                          )}
                          {prod.sem_gluten && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded" title="Sem Glúten">
                              SG
                            </span>
                          )}
                          {prod.sem_lactose && (
                            <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded" title="Sem Lactose">
                              SL
                            </span>
                          )}
                          {!prod.vegano && !prod.sem_gluten && !prod.sem_lactose && (
                            <span className="text-[9px] text-gray-400 font-medium">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status (Ativo / Inativo) */}
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            prod.ativo
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {prod.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleAbrirEdicao(prod)}
                            title="Editar Produto"
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleStatus(prod.id)}
                            title={prod.ativo ? 'Desativar Produto (Soft Delete)' : 'Reativar Produto'}
                            className={`p-1.5 rounded-lg transition ${
                              prod.ativo
                                ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {prod.ativo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela: Paginação */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
          <div>
            Mostrando <strong>{produtosFiltrados.length > 0 ? (paginaAtual - 1) * itensPorPagina + 1 : 0}</strong> a{' '}
            <strong>{Math.min(paginaAtual * itensPorPagina, produtosFiltrados.length)}</strong> de{' '}
            <strong>{produtosFiltrados.length}</strong> produtos
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-gray-800">
              {paginaAtual} / {totalPaginas}
            </span>
            <button
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro / Edição de Produto */}
      {modalAberta && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-8">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">
                  {produtoEditando ? 'Editar Produto' : 'Novo Produto no Catálogo'}
                </h3>
                <span className="text-[11px] text-emerald-200">
                  Preço de custo obrigatório para cálculo de margem e módulo de compras
                </span>
              </div>
              <button
                onClick={() => setModalAberta(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4 text-xs">
              {erroForm && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Leite Integral Piracanjuba 1 L"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-emerald-600"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Marca</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ex: Piracanjuba"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-medium"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Categoria *</label>
                  <select
                    value={categoriaId}
                    onChange={(e) => setCategoriaId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-medium"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} (ICMS {c.aliquota_icms}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* SKU */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Código SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ex: SKU-01042"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-mono text-gray-900"
                  />
                </div>

                {/* Unidade */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Unidade de Medida</label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value as UnidadeMedida)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-900"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="KG">KG (Quilograma)</option>
                    <option value="L">L (Litro)</option>
                    <option value="PCT">PCT (Pacote)</option>
                    <option value="CX">CX (Caixa)</option>
                  </select>
                </div>

                {/* Preço de Venda */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    required
                    value={precoVenda}
                    onChange={(e) => setPrecoVenda(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-emerald-500 rounded-xl p-2.5 text-xs font-black text-emerald-900"
                  />
                </div>

                {/* Preço de Custo (Obrigatório) */}
                <div>
                  <label className="font-bold text-rose-700 block mb-1 flex items-center justify-between">
                    <span>Preço de Custo (R$) *</span>
                    <span className="text-[10px] text-gray-400 font-normal">Obrigatório</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={precoCusto}
                    onChange={(e) => setPrecoCusto(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-rose-50/50 border border-rose-300 rounded-xl p-2.5 text-xs font-black text-rose-950"
                  />
                </div>

                {/* Estoque Atual */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Estoque Físico Atual</label>
                  <input
                    type="number"
                    min="0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-900"
                  />
                </div>

                {/* Estoque Mínimo */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Alerta Estoque Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-900"
                  />
                </div>

                {/* NCM Fiscal */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">NCM Fiscal (8 dígitos)</label>
                  <input
                    type="text"
                    value={ncm}
                    onChange={(e) => setNcm(e.target.value)}
                    placeholder="Ex: 0401.20.10"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs font-mono text-gray-900"
                  />
                </div>

                {/* URL da Imagem */}
                <div>
                  <label className="font-bold text-gray-700 block mb-1">URL da Imagem</label>
                  <input
                    type="url"
                    value={imagemUrl}
                    onChange={(e) => setImagemUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
                  />
                </div>

                {/* Descrição */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-gray-700 block mb-1">Descrição Detalhada</label>
                  <textarea
                    rows={2}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Informações adicionais do produto..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
                  />
                </div>

                {/* Flags Dietéticas e Status */}
                <div className="sm:col-span-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={semLactose}
                        onChange={(e) => setSemLactose(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      Sem Lactose
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={semGluten}
                        onChange={(e) => setSemGluten(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      Sem Glúten
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                      <input
                        type="checkbox"
                        checked={vegano}
                        onChange={(e) => setVegano(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      Vegano
                    </label>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-black text-emerald-800">
                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    Produto Ativo no E-commerce
                  </label>
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberta(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2 px-5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {produtoEditando ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
