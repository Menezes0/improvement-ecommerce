'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Sparkles, User, LogOut, ShieldAlert, Store, Package } from 'lucide-react';

export function Navbar() {
  const { usuario, papel, loginAsDemo, logout } = useAuth();
  const { quantidadeTotal, setIsCartOpen } = useCart();
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Barra superior de demonstração acadêmica e troca rápida de perfil */}
      <div className="bg-emerald-800 text-white text-xs py-1.5 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-semibold bg-emerald-700 px-2 py-0.5 rounded text-[10px] tracking-wide uppercase">
            IFRO Campus Porto Velho Calama
          </span>
          <span className="hidden sm:inline text-emerald-100">
            Prova de Conceito — Improvement e-commerce
          </span>
        </div>

        {/* Seletor rápido de perfil (RF25, CA33) */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="flex items-center gap-1.5 bg-emerald-950 hover:bg-emerald-900 px-2.5 py-1 rounded transition text-emerald-100 hover:text-white"
          >
            <span>Perfil: <strong>{papel.toUpperCase()}</strong></span>
            {usuario && <span className="opacity-75">({usuario.nome.split(' ')[0]})</span>}
            <span className="text-[10px]">▼</span>
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-1 w-64 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Alternar Usuário de Teste
              </div>
              <button
                onClick={() => { loginAsDemo('cliente1'); setShowDemoMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-xs flex justify-between items-center"
              >
                <span>Maria da Silva <strong>(Cliente)</strong></span>
                <span className="text-gray-400 text-[10px]">CA01, CA06</span>
              </button>
              <button
                onClick={() => { loginAsDemo('cliente2'); setShowDemoMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-xs flex justify-between items-center"
              >
                <span>João Santos <strong>(Cliente 2)</strong></span>
                <span className="text-gray-400 text-[10px]">Concorrência</span>
              </button>
              <button
                onClick={() => { loginAsDemo('operador'); setShowDemoMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-xs flex justify-between items-center"
              >
                <span>Luiz Carlos <strong>(Operador Loja)</strong></span>
                <span className="text-amber-600 text-[10px]">Painel Operador</span>
              </button>
              <button
                onClick={() => { loginAsDemo('admin'); setShowDemoMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-purple-50 text-xs flex justify-between items-center"
              >
                <span>Admin Geral <strong>(Administrador)</strong></span>
                <span className="text-purple-600 text-[10px]">Config & Carga</span>
              </button>
              <div className="border-t my-1"></div>
              <button
                onClick={() => { logout(); setShowDemoMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 text-xs flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Desconectar (Modo Visitante)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra principal de navegação */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:bg-emerald-700 transition">
            IE
          </div>
          <div>
            <div className="font-extrabold text-gray-900 tracking-tight leading-none text-lg">
              Improvement
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold tracking-wider uppercase">
              Supermercados · PVH
            </div>
          </div>
        </Link>

        {/* Links de navegação */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            href="/"
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-700 hover:bg-gray-50 rounded-lg transition"
          >
            Catálogo
          </Link>
          <Link
            href="/ofertas"
            className="px-3 py-2 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            Mural de Ofertas
          </Link>
          {usuario && (
            <Link
              href="/pedidos"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-1"
            >
              <Package className="w-4 h-4 text-gray-500" />
              Meus Pedidos
            </Link>
          )}

          {/* Links restritos por papel (RF03) */}
          {(papel === 'operador' || papel === 'admin') && (
            <Link
              href="/operador"
              className="px-3 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center gap-1 border border-emerald-200"
            >
              <Store className="w-4 h-4" />
              Painel do Operador
            </Link>
          )}

          {papel === 'admin' && (
            <Link
              href="/admin"
              className="px-3 py-2 text-sm font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition flex items-center gap-1 border border-purple-200"
            >
              <ShieldAlert className="w-4 h-4" />
              Administração
            </Link>
          )}
        </nav>

        {/* Ações da direita: Carrinho e Login */}
        <div className="flex items-center gap-3">
          {/* Botão da Sacola / Carrinho */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-2 rounded-xl font-medium text-sm transition border border-emerald-200"
            aria-label="Abrir Sacola de Compras"
          >
            <ShoppingBag className="w-5 h-5 text-emerald-700" />
            <span className="hidden sm:inline font-semibold">Sacola</span>
            {quantidadeTotal > 0 && (
              <span className="bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {quantidadeTotal}
              </span>
            )}
          </button>

          {/* Login / Perfil */}
          {!usuario ? (
            <Link
              href="/login"
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-2 rounded-xl text-sm font-medium transition"
            >
              <User className="w-4 h-4" />
              <span>Entrar</span>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l">
              <div className="text-right">
                <div className="text-xs font-bold text-gray-800 leading-tight">
                  {usuario.nome}
                </div>
                <div className="text-[10px] text-gray-500 capitalize">
                  {usuario.papel}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
