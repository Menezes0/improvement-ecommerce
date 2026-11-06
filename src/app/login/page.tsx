'use client';

import React, { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const { login, loginAsDemo } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const retorno = searchParams.get('retorno') || '/';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const res = await login(email, senha);
    setCarregando(false);

    if (res.success) {
      router.push(retorno);
    } else {
      // RF02, CA04: Mensagem genérica sem indicar qual campo está incorreto
      setErro(res.error || 'E-mail ou senha inválidos.');
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-5">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-xl font-black mb-2">
          IE
        </div>
        <h1 className="text-xl font-black text-gray-900">Acesse sua Conta</h1>
        <p className="text-xs text-gray-500">
          Informe suas credenciais ou use o acesso rápido demonstrativo abaixo.
        </p>
      </div>

      {/* Feedback de Erro Genérico (RF02, CA04) */}
      {erro && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{erro}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-gray-700 mb-1">E-mail</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              required
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Senha</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
        >
          {carregando ? 'Entrando...' : 'Entrar no Sistema'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-2 text-center text-xs text-gray-500">
        Não tem uma conta?{' '}
        <Link href="/cadastro" className="text-emerald-700 font-bold hover:underline">
          Cadastre-se grátis (RF01)
        </Link>
      </div>

      {/* Bloco de Acesso Rápido para Avaliação e Demonstração (RF25, CA33) */}
      <div className="pt-4 border-t border-gray-100 space-y-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Acesso Rápido com 1 Clique (Demo)
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              loginAsDemo('cliente1');
              router.push(retorno);
            }}
            className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl font-bold text-left transition"
          >
            Maria (Cliente)
            <span className="block text-[10px] font-normal text-emerald-700">maria@exemplo.com</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loginAsDemo('operador');
              router.push('/operador');
            }}
            className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl font-bold text-left transition"
          >
            Luiz (Operador)
            <span className="block text-[10px] font-normal text-amber-700">operador@supermercado.com</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loginAsDemo('admin');
              router.push('/admin');
            }}
            className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl font-bold text-left transition"
          >
            Admin Geral
            <span className="block text-[10px] font-normal text-purple-700">admin@supermercado.com</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loginAsDemo('cliente2');
              router.push(retorno);
            }}
            className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 rounded-xl font-bold text-left transition"
          >
            João (Cliente 2)
            <span className="block text-[10px] font-normal text-gray-500">joao@exemplo.com</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto my-12 px-4 space-y-6">
      <Suspense fallback={<div className="text-center p-8 text-xs text-gray-400">Carregando formulário...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
