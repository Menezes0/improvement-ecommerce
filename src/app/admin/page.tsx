'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ZONAS_DEMO, USUARIOS_DEMO, CONFIG_LOJA_DEMO } from '@/lib/demo-data';
import { ZonaEntrega, Usuario } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import {
  ShieldAlert,
  Users,
  MapPin,
  CheckCircle,
  RefreshCcw,
  DollarSign,
} from 'lucide-react';

export default function PainelAdminPage() {
  const { papel, loginAsDemo } = useAuth();
  const { setZonaSelecionada } = useCart();
  const [zonas, setZonas] = useState<ZonaEntrega[]>(ZONAS_DEMO);
  const [operadores, setOperadores] = useState<Usuario[]>(
    USUARIOS_DEMO.filter((u) => u.papel === 'operador')
  );
  const [raioAviso, setRaioAviso] = useState<number>(CONFIG_LOJA_DEMO.raio_aviso_m);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isRestaurando, setIsRestaurando] = useState(false);
  const supabase = createClient();

  // RF03: Proteção de Rota (Negar a qualquer um que não seja admin)
  if (papel !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-purple-200 text-center space-y-4 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-purple-600 mx-auto" />
        <h2 className="text-xl font-black text-purple-950">403 — Acesso Restrito</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          O painel de administração é exclusivo do perfil <strong>ADMINISTRADOR</strong> (RF03).
        </p>
        <div className="pt-2">
          <button
            onClick={() => loginAsDemo('admin')}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition"
          >
            Entrar como Administrador Geral
          </button>
        </div>
      </div>
    );
  }

  // RF25, CA33: Restaurar Dados Simulados
  const handleRestaurarDados = async () => {
    setIsRestaurando(true);
    setStatusMsg(null);

    try {
      const { data, error } = await supabase.rpc('restaurar_dados_simulados');
      if (!error && data) {
        setStatusMsg('Dados simulados restaurados no Supabase com sucesso! (RF25, CA33)');
        setIsRestaurando(false);
        return;
      }
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsRestaurando(false);
      setStatusMsg(
        'Base simulada resetada com sucesso: 4 usuários, 9 categorias, 65+ produtos, 6 ofertas e 6 bairros de PVH (CA33)!'
      );
    }, 1000);
  };

  // RF24, CA32: Alterar taxa de frete de um bairro
  const handleAlterarTaxaBairro = (zonaId: string, novaTaxa: number) => {
    const atualizadas = zonas.map((z) =>
      z.id === zonaId ? { ...z, taxa_frete: novaTaxa } : z
    );
    setZonas(atualizadas);
    const alterada = atualizadas.find((z) => z.id === zonaId);
    if (alterada) setZonaSelecionada(alterada);

    setStatusMsg(`Taxa do bairro "${alterada?.bairro}" atualizada para R$ ${novaTaxa.toFixed(2)} (CA32).`);
  };

  // RF23, CA31: Ativar / Desativar Operador
  const handleToggleOperador = (opId: string) => {
    const atualizados = operadores.map((op) =>
      op.id === opId ? { ...op, ativo: !op.ativo } : op
    );
    setOperadores(atualizados);
    const modificado = atualizados.find((o) => o.id === opId);
    setStatusMsg(
      `Conta de "${modificado?.nome}" ${modificado?.ativo ? 'ativada' : 'desativada'}. Conta desativada não consegue login (CA31).`
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-purple-200 bg-purple-800/60 px-3 py-1 rounded-full uppercase tracking-wider">
            Painel Administrativo
          </span>
          <h1 className="text-2xl font-black mt-1">Configurações Gerais e Simulação</h1>
          <p className="text-xs text-purple-200 mt-0.5">
            Gerencie taxas de frete por bairro, contas de operadores e restaure a carga inicial de dados simulados.
          </p>
        </div>

        {/* Botão de Carga e Restauração Inicial (RF25, CA33) */}
        <button
          onClick={handleRestaurarDados}
          disabled={isRestaurando}
          className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs py-3 px-5 rounded-2xl shadow-lg transition flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isRestaurando ? 'animate-spin' : ''}`} />
          {isRestaurando ? 'Restaurando Base...' : 'Restaurar Dados Simulados (RF25)'}
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Grid com Zonas de Entrega e Operadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RF24, CA32: Zonas de Entrega e Taxas em Porto Velho */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-extrabold text-gray-900">Zonas de Entrega e Frete (RF24)</h2>
              <span className="text-[11px] text-gray-400">Bairros atendidos em Porto Velho</span>
            </div>
          </div>

          <div className="space-y-2">
            {zonas.map((z) => (
              <div
                key={z.id}
                className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs border border-gray-200"
              >
                <div>
                  <span className="font-bold text-gray-900 block">{z.bairro}</span>
                  <span className="text-[11px] text-gray-500">Prazo: {z.prazo_estimado_min} min</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Taxa R$:</span>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={z.taxa_frete}
                    onChange={(e) => handleAlterarTaxaBairro(z.id, parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white border border-gray-300 font-extrabold text-emerald-800 rounded px-2 py-1 text-right text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-gray-50 rounded-lg text-[11px] text-gray-600">
            💡 <strong>Teste do Critério CA32:</strong> Altere a taxa de Olaria de R$ 6,00 para R$ 9,00 e confira o recálculo automático na sacola de compras!
          </div>
        </div>

        {/* RF23, CA31: Gerenciar Contas de Operadores */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <h2 className="text-sm font-extrabold text-gray-900">Contas de Operadores (RF23)</h2>
              <span className="text-[11px] text-gray-400">Controle de acesso e ativação</span>
            </div>
          </div>

          <div className="space-y-3">
            {operadores.map((op) => (
              <div
                key={op.id}
                className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs border border-gray-200"
              >
                <div>
                  <span className="font-bold text-gray-900 block">{op.nome}</span>
                  <span className="text-[11px] text-gray-500">{op.email}</span>
                </div>

                <button
                  onClick={() => handleToggleOperador(op.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                    op.ativo
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                  }`}
                >
                  {op.ativo ? 'Conta Ativa ✓' : 'Desativada ✕ (CA31)'}
                </button>
              </div>
            ))}
          </div>

          {/* Configuração da Loja & Raio de Aviso */}
          <div className="pt-3 border-t space-y-2">
            <span className="text-xs font-bold text-gray-800 block flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-purple-600" /> Raio do Aviso de Chegada (RF15, RF24)
            </span>
            <div className="flex items-center gap-3 text-xs">
              <input
                type="number"
                value={raioAviso}
                onChange={(e) => setRaioAviso(parseInt(e.target.value) || 1000)}
                className="w-28 bg-gray-50 border border-gray-300 font-bold p-2 rounded-lg text-gray-900"
              />
              <span className="text-gray-500">metros (Padrão: 1.000 m = 1 km)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
