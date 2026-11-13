'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PRODUTOS_DEMO, CATEGORIAS_DEMO } from '@/lib/demo-data';
import { Produto } from '@/types/database';
import { ProductCard } from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, 
  Filter, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Store, 
  Flame, 
  ArrowRight, 
  ChevronRight,
  CheckCircle2,
  ShoppingBag
} from 'lucide-react';
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

// Imagens temáticas de alta resolução para as 9 Categorias
const FOTOS_CATEGORIAS: Record<string, string> = {
  'Hortifrúti': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
  'Carnes e Aves': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
  'Laticínios e Frios': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80',
  'Padaria e Confeitaria': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  'Mercearia Básica': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  'Bebidas': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
  'Limpeza': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
  'Higiene Pessoal': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'Dietas e Saudáveis': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80',
};

function CatalogoContent() {
  const searchParams = useSearchParams();
  const [produtos, setProdutos] = useState<Produto[]>(PRODUTOS_DEMO);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [filtroSemLactose, setFiltroSemLactose] = useState(false);
  const [filtroSemGluten, setFiltroSemGluten] = useState(false);
  const [filtroVegano, setFiltroVegano] = useState(false);
  const supabase = createClient();

  // Ler parâmetros de URL iniciais se houver
  useEffect(() => {
    const catUrl = searchParams.get('cat');
    const buscaUrl = searchParams.get('busca');
    const filtroUrl = searchParams.get('filtro');

    if (catUrl) setCategoriaSelecionada(catUrl);
    if (buscaUrl) setTermoBusca(buscaUrl);
    if (filtroUrl === 'sem-lactose') setFiltroSemLactose(true);
    if (filtroUrl === 'sem-gluten') setFiltroSemGluten(true);
    if (filtroUrl === 'vegano') setFiltroVegano(true);
  }, [searchParams]);

  // Escutar atualizações de estoque e produtos em tempo real (RF06, RNF09)
  useEffect(() => {
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

    const channel = supabase
      .channel('realtime_produtos_home')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'produtos' },
        (payload) => {
          const atualizado = payload.new as Produto;
          setProdutos((prev) =>
            prev.map((p) =>
              p.id === atualizado.id
                ? { ...p, estoque: atualizado.estoque, preco: atualizado.preco, ativo: atualizado.ativo }
                : p
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Produtos em Oferta do Dia
  const produtosEmOferta = useMemo(() => {
    return produtos.filter(
      (p) => p.oferta_ativa && p.preco_promocional && p.preco_promocional > 0 && p.estoque > 0
    );
  }, [produtos]);

  // RF05, CA07: Filtragem Geral do Catálogo
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
        const bateCat = prod.categoria_nome?.toLowerCase().includes(termo);
        if (!bateNome && !bateMarca && !bateCat) return false;
      }

      // Filtros Alimentares (CA07)
      if (filtroSemLactose && !prod.sem_lactose) return false;
      if (filtroSemGluten && !prod.sem_gluten) return false;
      if (filtroVegano && !prod.vegano) return false;

      return true;
    });
  }, [produtos, categoriaSelecionada, termoBusca, filtroSemLactose, filtroSemGluten, filtroVegano]);

  const selecionarCategoria = (id: string) => {
    setCategoriaSelecionada(id);
    const catalogoEl = document.getElementById('catalogo');
    if (catalogoEl) {
      catalogoEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ============================================================== */}
      {/* 1. HERO SECTION DE ALTO IMPACTO (Seção B da Especificação)      */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14532D] via-[#16803C] to-emerald-900 text-white">
        {/* Padrão visual de fundo decorativo */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Texto de Apresentação */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-400/30 text-emerald-200 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                Supermercado Digital · Porto Velho - RO
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
                Seu supermercado favorito, <br className="hidden sm:inline" />
                <span className="text-amber-300 underline decoration-[#F97316] decoration-4 underline-offset-8">
                  agora a poucos cliques.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Qualidade de feira fresca, carnes selecionadas, catálogo completo sem glúten, sem lactose e vegano. Estoque em tempo real e entrega rápida no seu bairro.
              </p>

              {/* Botões de Ação do Hero */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <a
                  href="#catalogo"
                  className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-7 py-3.5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 fill-amber-950" />
                  Começar minhas compras
                </a>

                <a
                  href="#ofertas-dia"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-2xl backdrop-blur-xs border border-white/20 transition text-sm flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-[#F97316] fill-[#F97316]" />
                  Ver ofertas do dia
                </a>
              </div>

              {/* Destaque de Garantia */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-emerald-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Estoque 100% auditado
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Substituição consentida
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Frete transparente por bairro
                </span>
              </div>
            </div>

            {/* Imagem Hero de Composição Profissional */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Glow decorativo */}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-[#F97316] rounded-3xl blur-2xl opacity-30" />
                
                {/* Card com Foto de Alimentos Frescos */}
                <div className="relative rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-white/5 backdrop-blur-xs">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80"
                    alt="Alimentos frescos selecionados"
                    className="w-full h-80 sm:h-96 object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  {/* Badge Flutuante no Banner */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 text-gray-900 shadow-xl border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-black">
                        %
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-[#F97316] tracking-wider">Economia Garantida</p>
                        <p className="text-xs font-bold text-gray-800">Ofertas com até 30% OFF hoje</p>
                      </div>
                    </div>
                    <a
                      href="#ofertas-dia"
                      className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shrink-0"
                    >
                      Aproveitar
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. FAIXA DE BENEFÍCIOS E DIFERENCIAIS (Seção C da Especificação) */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16803C] flex items-center justify-center shrink-0 border border-emerald-100">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Produtos Selecionados</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Frutas, legumes e carnes inspecionados diariamente com garantia de frescor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16803C] flex items-center justify-center shrink-0 border border-emerald-100">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Estoque em Tempo Real</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Sincronização imediata no ato da compra para que nenhum item falte no seu pedido.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16803C] flex items-center justify-center shrink-0 border border-emerald-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Substituição Consentida</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Você escolhe se prefere troca por marca similar ou corte no valor final.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16803C] flex items-center justify-center shrink-0 border border-emerald-100">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">Clique & Retire com Aviso</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Aviso automático quando estiver a 1 km da loja para agilizar a entrega no balcão.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CATEGORIAS DE PRODUTOS VISUAIS (Seção D da Especificação)   */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-black uppercase text-[#16803C] tracking-wider">
              Departamentos da Loja
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Explore nossas categorias
            </h2>
          </div>
          <p className="text-xs text-gray-500 max-w-md sm:text-right">
            Clique em um departamento para filtrar instantaneamente o catálogo abaixo.
          </p>
        </div>

        {/* Grade de 9 Categorias Visuais */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {CATEGORIAS_DEMO.map((cat) => {
            const isSelecionada = categoriaSelecionada === cat.id;
            const foto = FOTOS_CATEGORIAS[cat.nome] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
            return (
              <button
                key={cat.id}
                onClick={() => selecionarCategoria(cat.id)}
                className={`group relative flex flex-col items-center text-center p-2 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelecionada
                    ? 'border-[#16803C] bg-emerald-50/80 shadow-md ring-2 ring-[#16803C]'
                    : 'border-gray-200/80 bg-white hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                {/* Foto da Categoria */}
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden mb-2 relative">
                  <img
                    src={foto}
                    alt={cat.nome}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>

                {/* Nome */}
                <span className={`text-xs font-bold leading-tight line-clamp-2 ${
                  isSelecionada ? 'text-[#16803C]' : 'text-gray-800 group-hover:text-[#16803C]'
                }`}>
                  {cat.nome}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. SEÇÃO DE OFERTAS DO DIA (Seção E da Especificação)           */}
      {/* ============================================================== */}
      {produtosEmOferta.length > 0 && (
        <section id="ofertas-dia" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 scroll-mt-28">
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent p-6 rounded-3xl border border-amber-300/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#F97316] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-white" /> Preços Especiais
                </span>
                <span className="text-xs font-bold text-amber-800">Ofertas do Dia</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Ofertas que fazem a diferença!
              </h2>
              <p className="text-xs text-gray-600">
                Aproveite descontos imperdíveis com estoque garantido enquanto durarem os lotes promocionais.
              </p>
            </div>

            <Link
              href="/ofertas"
              className="bg-[#14532D] hover:bg-[#16803C] text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-xs shrink-0"
            >
              <span>Ver Mural de Ofertas Completo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Grid de Ofertas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {produtosEmOferta.map((produto) => (
              <ProductCard key={`oferta-${produto.id}`} produto={produto} modoPromocional={true} />
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 5. BANNERS DE CAMPANHAS TEMÁTICAS (Recomendação #2 do Doc)     */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Campanha 1: Feira Fresca */}
          <div 
            onClick={() => selecionarCategoria('11111111-0000-0000-0000-000000000001')}
            className="group cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-6 shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                Quarta da Economia
              </span>
              <h3 className="text-xl font-black tracking-tight">Festival de Hortifrúti</h3>
              <p className="text-xs text-emerald-100 line-clamp-2">
                Bananas, tomates e hortaliças colhidos frescos da nossa região com preços especiais.
              </p>
              <div className="pt-2 text-xs font-bold text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Ver produtos da feira</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80"
              alt="Hortifrúti"
              className="absolute right-0 bottom-0 w-32 h-32 object-cover rounded-tl-full opacity-60 group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          {/* Campanha 2: Festival de Carnes */}
          <div 
            onClick={() => selecionarCategoria('11111111-0000-0000-0000-000000000005')}
            className="group cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-900 to-red-950 text-white p-6 shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                Açougue & Churrasco
              </span>
              <h3 className="text-xl font-black tracking-tight">Cortes Nobres Selecionados</h3>
              <p className="text-xs text-rose-100 line-clamp-2">
                Picanha 1953, alcatra e frango sadia com padrão de maciez incomparável.
              </p>
              <div className="pt-2 text-xs font-bold text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Ver cortes selecionados</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80"
              alt="Carnes Nobres"
              className="absolute right-0 bottom-0 w-32 h-32 object-cover rounded-tl-full opacity-60 group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          {/* Campanha 3: Saudáveis & Dietas */}
          <div 
            onClick={() => {
              setFiltroVegano(true);
              setFiltroSemLactose(true);
              const el = document.getElementById('catalogo');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 to-emerald-950 text-white p-6 shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                Linha Especial
              </span>
              <h3 className="text-xl font-black tracking-tight">Sem Lactose, Sem Glúten & Vegano</h3>
              <p className="text-xs text-teal-100 line-clamp-2">
                Leites zero lactose, queijos veganos de castanha e pães sem glúten certificados.
              </p>
              <div className="pt-2 text-xs font-bold text-amber-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Explorar linha saudável</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80"
              alt="Alimentos Saudáveis"
              className="absolute right-0 bottom-0 w-32 h-32 object-cover rounded-tl-full opacity-60 group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. CATÁLOGO GERAL E FILTROS ALIMENTARES (Seção F e G)          */}
      {/* ============================================================== */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-24">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <span className="text-xs font-black uppercase text-[#16803C] tracking-wider">
              Catálogo Geral Disponível
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Escolhas para facilitar suas compras
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Estoque sincronizado em tempo real (RF06)</span>
          </div>
        </div>

        {/* Barra de Filtros e Busca Local do Catálogo */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Campo de Busca Rápida */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Filtrar por arroz, carne, queijo, pão..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16803C] focus:bg-white transition font-medium"
              />
              {termoBusca && (
                <button
                  onClick={() => setTermoBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtros Alimentares Nutricionais (RF05, CA07) */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Restrições:
              </span>

              <button
                onClick={() => setFiltroSemLactose(!filtroSemLactose)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  filtroSemLactose
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                }`}
              >
                Sem Lactose
              </button>

              <button
                onClick={() => setFiltroSemGluten(!filtroSemGluten)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  filtroSemGluten
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                Sem Glúten
              </button>

              <button
                onClick={() => setFiltroVegano(!filtroVegano)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                  filtroVegano
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                🌱 100% Vegano
              </button>

              {(filtroSemLactose || filtroSemGluten || filtroVegano || categoriaSelecionada !== 'todos' || termoBusca) && (
                <button
                  onClick={() => {
                    setFiltroSemLactose(false);
                    setFiltroSemGluten(false);
                    setFiltroVegano(false);
                    setCategoriaSelecionada('todos');
                    setTermoBusca('');
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline px-2 cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Abas de Categorias */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs border-t border-gray-100 pt-3">
            <button
              onClick={() => setCategoriaSelecionada('todos')}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                categoriaSelecionada === 'todos'
                  ? 'bg-[#16803C] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos os Departamentos ({produtos.length})
            </button>
            {CATEGORIAS_DEMO.map((cat) => {
              const contagem = produtos.filter((p) => p.categoria_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSelecionada(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
                    categoriaSelecionada === cat.id
                      ? 'bg-[#16803C] text-white font-bold shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.nome} ({contagem})
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Produtos do Catálogo */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-extrabold text-gray-900">
              Produtos Encontrados ({produtosFiltrados.length})
            </h3>
            {categoriaSelecionada !== 'todos' && (
              <span className="text-xs text-gray-500 font-semibold">
                Setor: <strong>{CATEGORIAS_DEMO.find((c) => c.id === categoriaSelecionada)?.nome}</strong>
              </span>
            )}
          </div>

          {produtosFiltrados.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500 space-y-3">
              <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
              <h4 className="font-bold text-gray-800 text-base">Nenhum produto encontrado</h4>
              <p className="text-xs max-w-sm mx-auto">
                Não localizamos produtos com os filtros aplicados. Tente buscar por outros termos ou limpar as restrições alimentares.
              </p>
              <button
                onClick={() => {
                  setFiltroSemLactose(false);
                  setFiltroSemGluten(false);
                  setFiltroVegano(false);
                  setCategoriaSelecionada('todos');
                  setTermoBusca('');
                }}
                className="mt-2 inline-block bg-[#16803C] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Ver todo o catálogo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
              {produtosFiltrados.map((prod) => (
                <ProductCard key={prod.id} produto={prod} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-emerald-800 font-bold text-sm">
        Carregando experiência do supermercado...
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}
