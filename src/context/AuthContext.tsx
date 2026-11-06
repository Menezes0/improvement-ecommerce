'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, PapelUsuario } from '@/types/database';
import { USUARIOS_DEMO } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  usuario: Usuario | null;
  papel: PapelUsuario;
  isLoading: boolean;
  login: (email: string, senha?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (tipo: 'admin' | 'operador' | 'cliente1' | 'cliente2') => void;
  logout: () => Promise<void>;
  setPapelTemporario: (novoPapel: PapelUsuario) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [papel, setPapel] = useState<PapelUsuario>('visitante');
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // 1. Tentar ler sessão do Supabase Auth
    async function carregarSessao() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Buscar perfil em public.usuarios
          const { data: perfil } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (perfil) {
            setUsuario(perfil);
            setPapel(perfil.papel);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback para armazenamento local simulado
      }

      // 2. Fallback: verificar se há usuário demo salvo no localStorage
      if (typeof window !== 'undefined') {
        const demoSalvo = localStorage.getItem('improvement_demo_user');
        if (demoSalvo) {
          try {
            const parsed = JSON.parse(demoSalvo);
            setUsuario(parsed);
            setPapel(parsed.papel);
          } catch {
            // Ignora erro de parse
          }
        }
      }
      setIsLoading(false);
    }

    carregarSessao();
  }, []);

  const login = async (email: string, senha?: string) => {
    setIsLoading(true);

    // Tentar login no Supabase
    try {
      if (senha) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (!error && data.user) {
          const { data: perfil } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (perfil) {
            setUsuario(perfil);
            setPapel(perfil.papel);
            localStorage.setItem('improvement_demo_user', JSON.stringify(perfil));
            setIsLoading(false);
            return { success: true };
          }
        }
      }
    } catch {
      // Segue para fallback simulado
    }

    // Fallback: verificar lista de demonstração
    const demoUser = USUARIOS_DEMO.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (demoUser) {
      setUsuario(demoUser);
      setPapel(demoUser.papel);
      localStorage.setItem('improvement_demo_user', JSON.stringify(demoUser));
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    // RF02: Mensagem genérica sem indicar qual campo está incorreto
    return { success: false, error: 'E-mail ou senha inválidos.' };
  };

  const loginAsDemo = (tipo: 'admin' | 'operador' | 'cliente1' | 'cliente2') => {
    let demoUser: Usuario | undefined;
    if (tipo === 'admin') demoUser = USUARIOS_DEMO[0];
    else if (tipo === 'operador') demoUser = USUARIOS_DEMO[1];
    else if (tipo === 'cliente1') demoUser = USUARIOS_DEMO[2];
    else if (tipo === 'cliente2') demoUser = USUARIOS_DEMO[3];

    if (demoUser) {
      setUsuario(demoUser);
      setPapel(demoUser.papel);
      localStorage.setItem('improvement_demo_user', JSON.stringify(demoUser));
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignora erro se não conectado ao Supabase
    }
    setUsuario(null);
    setPapel('visitante');
    localStorage.removeItem('improvement_demo_user');
  };

  const setPapelTemporario = (novoPapel: PapelUsuario) => {
    setPapel(novoPapel);
    if (usuario) {
      const atualizado = { ...usuario, papel: novoPapel };
      setUsuario(atualizado);
      localStorage.setItem('improvement_demo_user', JSON.stringify(atualizado));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        papel,
        isLoading,
        login,
        loginAsDemo,
        logout,
        setPapelTemporario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
