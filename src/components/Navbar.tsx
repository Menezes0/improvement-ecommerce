'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { PRODUTOS_DEMO, CATEGORIAS_DEMO } from '@/lib/demo-data';
import { Produto } from '@/types/database';
import { ProductImage } from '@/components/ProductImage';
import { 
  ShoppingBag, 
  User, 
  LogOut, 
  ShieldAlert, 
  Store, 
  Package, 
  Search, 
  MapPin, 
  Phone, 
  ChevronDown, 
  Flame,
  CheckCircle2
} from 'lucide-react';

export function Navbar() {
  const { usuario, papel, loginAsDemo, logout } = useAuth();
  const { quantidadeTotal, subtotal, setIsCartOpen } = useCart();
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<Produto[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fechar dropdown de sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca inteligente com autocomplete
  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTermoBusca(val);

    if (val.trim().length >= 2) {
      const termo = val.toLowerCase();
      const filtrados = PRODUTOS_DEMO.filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          p.marca.toLowerCase().includes(termo) ||
          p.categoria_nome?.toLowerCase().includes(termo)
      ).slice(0, 5);
      setSugestoes(filtrados);
      setMostrarSugestoes(true);
    } else {
      setSugestoes([]);
      setMostrarSugestoes(false);
    }
  };

  const handleSubmeterBusca = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarSugestoes(false);
    if (termoBusca.trim()) {
      router.push(`/?busca=${encodeURIComponent(termoBusca.trim())}#catalogo`);
    }
  };

  const selecionarSugestao = (produto: Produto) => {
    setMostrarSugestoes(false);
    setTermoBusca(produto.nome);
    router.push(`/?busca=${encodeURIComponent(produto.nome)}#catalogo`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      {/* 1. BARRA SUPERIOR INSTITUCIONAL & CONTROLE DE DEMO */}
      <div className="bg-[#14532D] text-white text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/60">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          {/* Localização e Horário */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-100">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Entregar em:</span>
              <strong className="text-white font-semibold">Porto Velho - RO</strong>
            </div>
            <span className="hidden md:inline text-emerald-400/50">|</span>
            <div className="hidden md:flex items-center gap-1 text-[11px] text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Loja Centro aberta até 22h</span>
            </div>
          </div>

          {/* SAC e Seletor de Perfil Acadêmico/Demonstração (RF25, CA33) */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-200">
              <Phone className="w-3 h-3 text-emerald-300" />
              <span>Televendas: <strong>(69) 3217-0000</strong></span>
            </div>

            {/* Menu Dropdown de Perfil Rápido */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="flex items-center gap-1.5 bg-emerald-900/80 hover:bg-emerald-950 px-2.5 py-0.5 rounded-lg transition text-[11px] text-emerald-100 border border-emerald-700/60"
                title="Alternar entre papéis de usuário (RF25)"
              >
                <span>Perfil: <strong className="uppercase text-amber-300">{papel}</strong></span>
                {usuario && <span className="opacity-80">({usuario.nome.split(' ')[0]})</span>}
                <ChevronDown className="w-3 h-3 text-emerald-300" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Simulação de Usuários (RF25, CA33)
                  </div>
                  <button
                    onClick={() => { loginAsDemo('cliente1'); setShowDemoMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-gray-900">Maria da Silva</p>
                      <p className="text-[10px] text-gray-500">Cliente (Zona Olaria · R$ 6 frete)</p>
                    </div>
                    {usuario?.id.endsWith('0003') && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => { loginAsDemo('cliente2'); setShowDemoMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-gray-900">João Santos</p>
                      <p className="text-[10px] text-gray-500">Cliente (Zona Caiari · R$ 8 frete)</p>
                    </div>
                    {usuario?.id.endsWith('0004') && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => { loginAsDemo('operador'); setShowDemoMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-amber-900">Luiz Carlos (Operador)</p>
                      <p className="text-[10px] text-amber-700">Painel de Separação de Pedidos</p>
                    </div>
                    {papel === 'operador' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </button>
                  <button
                    onClick={() => { loginAsDemo('admin'); setShowDemoMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-purple-50 text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-purple-900">Administrador Geral</p>
                      <p className="text-[10px] text-purple-700">Gestão, Estoque e Carga</p>
                    </div>
                    {papel === 'admin' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                  </button>
                  <div className="border-t my-1"></div>
                  <button
                    onClick={() => { logout(); setShowDemoMenu(false); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 text-xs flex items-center gap-1.5 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Modo Visitante (Desconectar)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BARRA PRINCIPAL: LOGO, BUSCA INTELIGENTE E AÇÕES */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          {/* LOGO DO SUPERMERCADO */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 rounded-2xl bg-[#16803C] group-hover:bg-[#14532D] text-white flex items-center justify-center font-black text-2xl shadow-sm transition-all duration-200">
              IE
            </div>
            <div>
              <div className="font-black text-xl tracking-tight text-gray-900 leading-none">
                Improvement
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#16803C]">Supermercados</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">PVH</span>
              </div>
            </div>
          </Link>

          {/* BUSCA INTELIGENTE COM AUTOCOMPLETE (Recomendação #3 do Documento) */}
          <div ref={searchRef} className="relative flex-1 max-w-2xl hidden md:block">
            <form onSubmit={handleSubmeterBusca} className="relative">
              <input
                type="text"
                value={termoBusca}
                onChange={handleBuscaChange}
                onFocus={() => { if (sugestoes.length > 0) setMostrarSugestoes(true); }}
                placeholder="O que você procura hoje? (ex: picanha, leite zero lactose, arroz, café...)"
                className="w-full pl-11 pr-24 py-2.5 bg-gray-50 hover:bg-white focus:bg-white border-2 border-emerald-600/30 focus:border-[#16803C] rounded-2xl text-sm outline-hidden transition shadow-2xs font-medium placeholder:text-gray-400"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#16803C] hover:bg-[#14532D] text-white px-4 py-1.5 rounded-xl font-bold text-xs transition"
              >
                Buscar
              </button>
            </form>

            {/* Dropdown de Sugestões Instantâneas */}
            {mostrarSugestoes && sugestoes.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden divide-y divide-gray-50">
                <div className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center bg-gray-50/70">
                  <span>Produtos Encontrados</span>
                  <span>{sugestoes.length} sugestões</span>
                </div>
                {sugestoes.map((item) => {
                  const preco = item.preco_promocional && item.preco_promocional > 0 ? item.preco_promocional : item.preco;
                  return (
                    <div
                      key={item.id}
                      onClick={() => selecionarSugestao(item)}
                      className="px-4 py-2.5 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                          <ProductImage
                            src={item.imagem_url}
                            alt={item.nome}
                            categoria={item.categoria_nome}
                            className="w-10 h-10"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-1">{item.nome}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span>{item.marca}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">{item.categoria_nome}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-gray-900">
                          R$ {preco.toFixed(2).replace('.', ',')}
                        </span>
                        {item.preco_promocional && item.preco_promocional > 0 && (
                          <span className="block text-[9px] text-[#F97316] font-bold uppercase">Oferta</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTÕES DE AÇÃO: MEUS PEDIDOS, CONTA E SACOLA */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Meus Pedidos (se logado) */}
            {usuario && (
              <Link
                href="/pedidos"
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#16803C] hover:bg-emerald-50 rounded-xl transition"
              >
                <Package className="w-4 h-4 text-gray-500" />
                <span>Meus Pedidos</span>
              </Link>
            )}

            {/* Painéis Especiais */}
            {(papel === 'operador' || papel === 'admin') && (
              <Link
                href="/operador"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition border border-amber-200"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Operador</span>
              </Link>
            )}

            {papel === 'admin' && (
              <Link
                href="/admin"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-xl transition border border-purple-200"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Login / Perfil */}
            {!usuario ? (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-emerald-700 font-semibold text-xs rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] text-gray-400 font-medium">Bem-vindo(a)</p>
                  <p className="text-xs font-bold leading-tight">Entrar na Conta</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {usuario.nome.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-1">{usuario.nome.split(' ')[0]}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold capitalize">{usuario.papel}</p>
                </div>
              </div>
            )}

            {/* BOTÃO DA SACOLA INTELIGENTE (CartDrawer) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 bg-[#16803C] hover:bg-[#14532D] text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition shadow-sm hover:shadow-md cursor-pointer group"
              aria-label="Abrir Sacola de Compras"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
                {quantidadeTotal > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F97316] text-white text-[10px] font-black rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-xs animate-bounce">
                    {quantidadeTotal}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-[9px] uppercase tracking-wider text-emerald-200 font-bold leading-none">Minha Sacola</span>
                <span className="text-xs font-extrabold text-white">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Busca Mobile (visível apenas em telas pequenas) */}
        <div className="mt-3 block md:hidden">
          <form onSubmit={handleSubmeterBusca} className="relative">
            <input
              type="text"
              value={termoBusca}
              onChange={handleBuscaChange}
              placeholder="Buscar no supermercado..."
              className="w-full pl-10 pr-20 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-hidden"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#16803C] text-white px-3 py-1 rounded-lg font-bold text-[11px]"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* 3. SEGUNDA LINHA: DEPARTAMENTOS & ATALHOS RÁPIDOS */}
      <div className="border-t border-gray-100 bg-[#F8FAF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none text-xs">
            {/* Todas as Categorias */}
            <Link
              href="/#catalogo"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-gray-800 hover:bg-white hover:text-emerald-700 transition whitespace-nowrap shrink-0"
            >
              <span>Todos os Setores</span>
            </Link>

            {/* Mural de Ofertas com badge chamativo */}
            <Link
              href="/ofertas"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black bg-gradient-to-r from-amber-500 to-[#F97316] text-white shadow-xs hover:brightness-105 transition whitespace-nowrap shrink-0"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>Mural de Ofertas</span>
              <span className="bg-white/25 text-[10px] px-1.5 py-0.2 rounded-full uppercase">Até 30% OFF</span>
            </Link>

            <span className="text-gray-300">|</span>

            {/* Categorias Principais */}
            {CATEGORIAS_DEMO.map((cat) => (
              <Link
                key={cat.id}
                href={`/?cat=${cat.id}#catalogo`}
                className="px-2.5 py-1.5 rounded-xl font-medium text-gray-600 hover:text-emerald-700 hover:bg-white transition whitespace-nowrap shrink-0 text-xs"
              >
                {cat.nome}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
