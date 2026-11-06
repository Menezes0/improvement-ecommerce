'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cadastroSchema } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';
import { USUARIOS_DEMO } from '@/lib/demo-data';
import { User, Mail, Phone, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CadastroPage() {
  const { login } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');

  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    // Validação com Zod (RF01, RNF02, CA35)
    const validacao = cadastroSchema.safeParse({
      nome,
      email,
      telefone,
      password: senha,
    });

    if (!validacao.success) {
      setErro(validacao.error.issues[0]?.message || 'Dados inválidos.');
      return;
    }

    // CA02: Verificar se e-mail já existe
    const existeDemo = USUARIOS_DEMO.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existeDemo) {
      setErro('Este e-mail já está cadastrado no sistema (CA02). Tente fazer login.');
      return;
    }

    setCarregando(true);

    try {
      // Tentar cadastrar no Supabase Auth
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome,
            telefone,
            papel: 'cliente', // RF01: conta nasce com papel cliente
          },
        },
      });

      if (error) {
        setErro(error.message);
        setCarregando(false);
        return;
      }
    } catch {
      // Fallback
    }

    setCarregando(false);
    setSucesso(true);

    // Efetuar login automático
    await login(email, senha);

    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-5">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-xl font-black mb-2">
            IE
          </div>
          <h1 className="text-xl font-black text-gray-900">Crie sua Conta (RF01)</h1>
          <p className="text-xs text-gray-500">
            Compre online, escolha regras de substituição e receba em casa ou retire na loja.
          </p>
        </div>

        {erro && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Conta criada com sucesso! Redirecionando...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Nome Completo</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>

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
            <label className="block font-bold text-gray-700 mb-1">Telefone com DDD</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(69) 99999-0000"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              Senha (mínimo de 8 caracteres - RF01, CA35)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs disabled:opacity-50 mt-2"
          >
            {carregando ? 'Criando conta...' : 'Cadastrar e Entrar (CA01)'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-gray-500">
          Já possui conta?{' '}
          <Link href="/login" className="text-emerald-700 font-bold hover:underline">
            Entrar agora
          </Link>
        </div>
      </div>
    </div>
  );
}
