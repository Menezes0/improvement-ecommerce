'use client';

import React, { useState } from 'react';
import { Usuario, Pedido } from '@/types/database';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Plus,
  Lock,
  Unlock,
  ShoppingBag,
  Clock,
  X,
  Mail,
  Phone,
} from 'lucide-react';

interface AdminClientesOperadoresProps {
  usuarios: Usuario[];
  pedidos: Pedido[];
  onToggleUsuarioAtivo: (usuarioId: string) => void;
  onCadastrarOperador: (novoOperador: Usuario) => void;
}

export function AdminClientesOperadores({
  usuarios,
  pedidos,
  onToggleUsuarioAtivo,
  onCadastrarOperador,
}: AdminClientesOperadoresProps) {
  const [subAba, setSubAba] = useState<'clientes' | 'operadores'>('clientes');

  // Modal Novo Operador
  const [modalNovoOperador, setModalNovoOperador] = useState(false);
  const [nomeOp, setNomeOp] = useState('');
  const [emailOp, setEmailOp] = useState('');
  const [telefoneOp, setTelefoneOp] = useState('');

  // Clientes e Operadores
  const clientes = usuarios.filter((u) => u.papel === 'cliente');
  const operadores = usuarios.filter((u) => u.papel === 'operador');

  const handleSalvarOperador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeOp.trim() || !emailOp.trim()) return;

    const novo: Usuario = {
      id: `op-${Date.now()}`,
      nome: nomeOp.trim(),
      email: emailOp.trim(),
      telefone: telefoneOp.trim() || null,
      papel: 'operador',
      ativo: true,
      criado_em: new Date().toISOString(),
    };

    onCadastrarOperador(novo);
    setModalNovoOperador(false);
    setNomeOp('');
    setEmailOp('');
    setTelefoneOp('');
  };

  return (
    <div className="space-y-5">
      {/* Sub-navegação */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSubAba('clientes')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              subAba === 'clientes'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            Clientes Cadastrados ({clientes.length})
          </button>
          <button
            onClick={() => setSubAba('operadores')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              subAba === 'operadores'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Equipe de Operadores ({operadores.length})
          </button>
        </div>

        {subAba === 'operadores' && (
          <button
            onClick={() => setModalNovoOperador(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> + Cadastrar Operador
          </button>
        )}
      </div>

      {/* ABA CLIENTES */}
      {subAba === 'clientes' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <th className="p-3">Nome do Cliente</th>
                  <th className="p-3">E-mail / Contato</th>
                  <th className="p-3 text-center">Total de Pedidos</th>
                  <th className="p-3 text-right">Volume Gasto</th>
                  <th className="p-3 text-center">Status da Conta</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clientes.map((cli) => {
                  const pedidosCliente = pedidos.filter((p) => p.usuario_id === cli.id);
                  const totalGasto = pedidosCliente.reduce((acc, p) => acc + (p.status !== 'cancelado' ? p.total : 0), 0);

                  return (
                    <tr key={cli.id} className="hover:bg-gray-50/70">
                      <td className="p-3 font-bold text-gray-900">{cli.nome}</td>
                      <td className="p-3 text-gray-600">
                        <div>{cli.email}</div>
                        <div className="text-[10px] text-gray-400">{cli.telefone || 'Sem telefone'}</div>
                      </td>
                      <td className="p-3 text-center font-black text-gray-700">
                        {pedidosCliente.length} pedido(s)
                      </td>
                      <td className="p-3 text-right font-black text-emerald-800">
                        R$ {totalGasto.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            cli.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cli.ativo ? 'Liberado ✓' : 'Bloqueado ✕'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onToggleUsuarioAtivo(cli.id)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-xl transition flex items-center gap-1 mx-auto ${
                            cli.ativo
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {cli.ativo ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {cli.ativo ? 'Bloquear Cliente' : 'Desbloquear'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA OPERADORES */}
      {subAba === 'operadores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operadores.map((op) => (
            <div key={op.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm">{op.nome}</h4>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-gray-400" /> {op.email}
                  </div>
                  {op.telefone && (
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-gray-400" /> {op.telefone}
                    </div>
                  )}
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    op.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {op.ativo ? 'Ativo' : 'Desativado (CA31)'}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-500">
                  Acesso: Separação de Pedidos e Ajuste de Estoque
                </span>

                <button
                  onClick={() => onToggleUsuarioAtivo(op.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                    op.ativo
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {op.ativo ? 'Desativar Acesso' : 'Ativar Acesso'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NOVO OPERADOR */}
      {modalNovoOperador && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Cadastrar Novo Operador</h3>
                <span className="text-[11px] text-emerald-200">
                  Concede acesso ao módulo de separação de pedidos (/operador)
                </span>
              </div>
              <button onClick={() => setModalNovoOperador(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarOperador} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={nomeOp}
                  onChange={(e) => setNomeOp(e.target.value)}
                  placeholder="Ex: Carlos Mascarenhas (Operador)"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">E-mail de Login *</label>
                <input
                  type="email"
                  required
                  value={emailOp}
                  onChange={(e) => setEmailOp(e.target.value)}
                  placeholder="operador2@supermercado.com"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={telefoneOp}
                  onChange={(e) => setTelefoneOp(e.target.value)}
                  placeholder="(69) 99999-0000"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900"
                />
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl text-gray-600 text-[11px]">
                🔑 A senha inicial padrão para demonstração é: <strong>Senha@123</strong>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNovoOperador(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-6 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Criar Conta de Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
