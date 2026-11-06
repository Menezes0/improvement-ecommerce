'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PRODUTOS_DEMO, CATEGORIAS_DEMO } from '@/lib/demo-data';
import { Produto } from '@/types/database';
import { ProductCard } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface OfertaItem {
  preco_promocional: number;
  ativa: boolean;
  inicio: string;
  fim: string;
}

interface ProdutoComOfertaItem extends Produto {
  ofertas?: OfertaItem[];
}
export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<Produto[]>(PRODUTOS_DEMO);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroSemLactose, setFiltroSemLactose] = useState(false);
  const [filtroSemGluten, setFiltroSemGluten] = useState(false);
  const [filtroVegano, setFiltroVegano] = useState(false);
  const supabase = createClient();

  // Escutar atualizações de estoque e produtos em tempo real (RF06, RNF09)
  useEffect(() => {
    // 1. Tentar carregar do Supabase se disponível
    async function carregarProdutosSupabase() {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*, ofertas(preco_promocional, ativa, inicio, fim)')
          .eq('ativo', true);

        if (!error && data && data.length > 0) {
          const agora = new Date().toISOString();
          const formatados = (data as unknown as ProdutoComOfertaItem[]).map((p) => {
            const ofertaAtiva = p.ofertas?.find(
              (o) => o.ativa && agora >= o.inicio && agora <= o.fim
            );
            return {
              ...p,
              preco_promocional: ofertaAtiva ? ofertaAtiva.preco_promocional : null,
              oferta_ativa: !!ofertaAtiva,
            };
          });
          setProdutos(formatados);
        }
      } catch {
        // Fallback mantém PRODUTOS_DEMO
      }
    }

    carregarProdutosSupabase();

    // 2. Inscrever-se no Supabase Realtime (RF06: atualiza em <3s sem recarregar)
    const channel = supabase
      .channel('realtime_produtos')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'produtos' },
        (payload) => {
          const atualizado = payload.new as Produto;
          setProdutos((prev) =>
            prev.map((p) => (p.id === atualizado.id ? { ...p, estoque: atualizado.estoque, preco: atualizado.preco, ativo: atualizado.ativo } : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // RF05, CA07: Filtragem por Categoria, Busca e Restrições Alimentares
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((prod) => {
      // Categoria
      if (categoriaSelecionada !== 'todos' && prod.categoria_id !== categoriaSelecionada) {
        return false;
      }

      // Busca por nome ou marca
      if (termoBusca.trim() !== '') {
        const termo = termoBusca.toLowerCase();
        const bateNome = prod.nome.toLowerCase().includes(termo);
        const bateMarca = prod.marca.toLowerCase().includes(termo);
        if (!bateNome && !bateMarca) return false;
      }

      // Filtros Alimentares (CA07)
      if (filtroSemLactose && !prod.sem_lactose) return false;
      if (filtroSemGluten && !prod.sem_gluten) return false;
      if (filtroVegano && !prod.vegano) return false;

      return true;
    });
  }, [produtos, categoriaSelecionada, termoBusca, filtroSemLactose, filtroSemGluten, filtroVegano]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner Principal com Chamada para Mural de Ofertas */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <span className="bg-emerald-950/60 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Supermercado Regional · Porto Velho
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Estoque em Tempo Real e Substituição Consentida
          </h1>
          <p className="text-sm text-emerald-100">
            Navegue pelo catálogo com disponibilidade garantida. Se faltar algum item, você escolhe se aceita troca de marca ou o corte no valor final.
          </p>
        </div>

        <Link
          href="/ofertas"
          className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 shrink-0 text-sm"
        >
          <Sparkles className="w-5 h-5 fill-amber-950" />
          Ver Mural de Ofertas
        </Link>
      </div>

      {/* Barra de Busca e Filtros de Restrição Alimentar (RF05, CA07) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por produto, arroz, leite, café..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Filtros Alimentares (RF05, CA07) */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Dietas:
            </span>

            <button
              onClick={() => setFiltroSemLactose(!filtroSemLactose)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filtroSemLactose
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
              }`}
            >
              Sem Lactose
            </button>

            <button
              onClick={() => setFiltroSemGluten(!filtroSemGluten)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filtroSemGluten
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              Sem Glúten
            </button>

            <button
              onClick={() => setFiltroVegano(!filtroVegano)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                filtroVegano
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Vegano
            </button>

            {(filtroSemLactose || filtroSemGluten || filtroVegano) && (
              <button
                onClick={() => {
                  setFiltroSemLactose(false);
                  setFiltroSemGluten(false);
                  setFiltroVegano(false);
                }}
                className="text-xs text-rose-600 hover:underline px-2"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Abas de Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setCategoriaSelecionada('todos')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              categoriaSelecionada === 'todos'
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas as Categorias
          </button>
          {CATEGORIAS_DEMO.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaSelecionada(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                categoriaSelecionada === cat.id
                  ? 'bg-emerald-700 text-white font-bold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-extrabold text-gray-900">
            Produtos Disponíveis ({produtosFiltrados.length})
          </h2>
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sincronização em tempo real (RF06)
          </span>
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <h3 className="font-bold text-gray-800 text-base">Nenhum produto encontrado</h3>
            <p className="text-xs">
              Tente alterar os filtros de categoria ou restrição alimentar aplicados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtosFiltrados.map((prod) => (
              <ProductCard key={prod.id} produto={prod} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
