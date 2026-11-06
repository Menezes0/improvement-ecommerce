'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Pedido, StatusPedido } from '@/types/database';
import {
  Package,
  Clock,
  XCircle,
  Truck,
  Store,
  Navigation,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

export default function PedidosPage() {
  const { usuario } = useAuth();
  const {
    pedidosRealizados,
    cancelarPedidoCliente,
    registrarAvisoAproximacaoCliente,
    registrarAvisoChegueiCliente,
  } = useCart();

  const [geoFeedback, setGeoFeedback] = useState<{ [pedidoId: string]: string }>({});
  const [geoCarregando, setGeoCarregando] = useState<{ [pedidoId: string]: boolean }>({});

  if (!usuario) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-gray-200 text-center space-y-4">
        <Package className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900">Faça login para ver seus pedidos</h2>
        <p className="text-xs text-gray-500">
          Você precisa estar autenticado como cliente para acompanhar o status e o Clique e Retire.
        </p>
        <Link
          href="/login"
          className="inline-block bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm"
        >
          Entrar na Conta
        </Link>
      </div>
    );
  }

  // Filtrar pedidos deste usuário
  const meusPedidos = pedidosRealizados.filter((p) => p.usuario_id === usuario.id);

  // RF14, RF15, CA20, CA21: Acionar "Estou a caminho" com permissão de geolocalização
  const handleEstouACaminho = (pedido: Pedido) => {
    setGeoCarregando((prev) => ({ ...prev, [pedido.id]: true }));
    setGeoFeedback((prev) => ({ ...prev, [pedido.id]: 'Obtendo sua localização...' }));

    if (!navigator.geolocation) {
      setGeoFeedback((prev) => ({
        ...prev,
        [pedido.id]: 'Geolocalização não suportada no navegador. Utilize o botão "Cheguei".',
      }));
      setGeoCarregando((prev) => ({ ...prev, [pedido.id]: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const res = await registrarAvisoAproximacaoCliente(pedido.id, latitude, longitude);
        setGeoCarregando((prev) => ({ ...prev, [pedido.id]: false }));

        if (res.dentro_do_raio) {
          setGeoFeedback((prev) => ({
            ...prev,
            [pedido.id]: `Você está a ${res.distancia_m} m da loja (dentro do raio de 1 km). O operador foi notificado da sua chegada! (CA21)`,
          }));
        } else {
          setGeoFeedback((prev) => ({
            ...prev,
            [pedido.id]: `Você está a ${res.distancia_m} m da loja. O aviso de chegada será gerado automaticamente quando estiver a menos de 1.000 m (CA22).`,
          }));
        }
      },
      () => {
        // CA20: Se negar a permissão, explica e mantém opção "Cheguei"
        setGeoCarregando((prev) => ({ ...prev, [pedido.id]: false }));
        setGeoFeedback((prev) => ({
          ...prev,
          [pedido.id]:
            'Permissão de localização negada pelo navegador. Você ainda pode usar o botão "Cheguei" ao estacionar na loja (CA20, CA23).',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // RF16, CA23: Acionamento manual "Cheguei"
  const handleCheguei = async (pedido: Pedido) => {
    await registrarAvisoChegueiCliente(pedido.id);
    setGeoFeedback((prev) => ({
      ...prev,
      [pedido.id]: 'Aviso de chegada emitido manualmente com sucesso! O operador já visualizou no painel (CA23).',
    }));
  };

  const getStatusBadge = (status: StatusPedido) => {
    switch (status) {
      case 'recebido':
        return <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md text-xs border border-blue-200">Recebido</span>;
      case 'em_separacao':
        return <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-md text-xs border border-amber-200">Em Separação</span>;
      case 'pronto':
        return <span className="bg-purple-50 text-purple-700 font-bold px-2.5 py-1 rounded-md text-xs border border-purple-200">Pronto para Retirada</span>;
      case 'saiu_para_entrega':
        return <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-md text-xs border border-indigo-200">Saiu para Entrega</span>;
      case 'concluido':
        return <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-md text-xs border border-emerald-200">Concluído</span>;
      case 'cancelado':
        return <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-md text-xs border border-rose-200">Cancelado</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Meus Pedidos</h1>
          <p className="text-xs text-gray-500">
            Acompanhe o status em tempo real e ative o aviso de aproximação para retirada.
          </p>
        </div>
        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Atualização &lt; 3s (RF12)
        </span>
      </div>

      {meusPedidos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 space-y-3">
          <Package className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="font-bold text-gray-700 text-base">Você ainda não realizou pedidos</h3>
          <p className="text-xs">Navegue pelo catálogo e finalize sua primeira compra.</p>
          <Link
            href="/"
            className="inline-block bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
          >
            Ir ao Catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {meusPedidos.map((pedido) => {
            const podeCancelar = pedido.status === 'recebido'; // RF13, CA19
            const podeAvisarRetirada =
              pedido.tipo === 'retirada' &&
              ['recebido', 'em_separacao', 'pronto'].includes(pedido.status); // RF14

            return (
              <div
                key={pedido.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4"
              >
                {/* Header do Pedido */}
                <div className="flex flex-wrap justify-between items-start gap-2 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-500 uppercase">
                        #{pedido.id.substring(0, 10)}
                      </span>
                      {getStatusBadge(pedido.status)}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(pedido.criado_em).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-medium">Total</span>
                    <span className="text-lg font-extrabold text-emerald-800">
                      R$ {pedido.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Modalidade e Itens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[10px] block mb-1">
                      Modalidade
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                      {pedido.tipo === 'entrega' ? (
                        <>
                          <Truck className="w-4 h-4 text-emerald-600" />
                          <span>Entrega ({pedido.endereco?.bairro || 'Porto Velho'})</span>
                        </>
                      ) : (
                        <>
                          <Store className="w-4 h-4 text-purple-600" />
                          <span>Clique e Retire na Loja (Frete R$ 0,00)</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Resumo de Itens e Regras Escolhidas */}
                  <div>
                    <span className="text-gray-400 font-bold uppercase text-[10px] block mb-1">
                      Itens do Pedido ({pedido.itens?.length || 0})
                    </span>
                    <ul className="space-y-1 text-[11px] text-gray-600">
                      {pedido.itens?.map((it) => (
                        <li key={it.id} className="flex justify-between items-center">
                          <span>
                            {it.quantidade}x {it.produto?.nome || 'Produto'}
                          </span>
                          <span className="text-gray-400 text-[10px]">
                            {it.regra_substituicao === 'troca_marca' ? 'Troca marca' : 'Não substituir'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bloco de Clique e Retire (Geolocalização / RF14, RF15, RF16) */}
                {podeAvisarRetirada && (
                  <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-purple-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-700" /> Clique e Retire — Aviso de Aproximação
                      </span>
                      {pedido.a_caminho && (
                        <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          A caminho ativo
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-purple-700 leading-snug">
                      Avise à equipe da loja que você saiu de casa. Ao chegar a menos de 1.000 m, seu pedido é posicionado no balcão sem filas.
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Botão "Estou a caminho" com GPS */}
                      <button
                        onClick={() => handleEstouACaminho(pedido)}
                        disabled={geoCarregando[pedido.id]}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-xs transition flex items-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        {geoCarregando[pedido.id] ? 'Obtendo GPS...' : 'Estou a caminho (GPS)'}
                      </button>

                      {/* Botão manual "Cheguei" (RF16, CA23) */}
                      <button
                        onClick={() => handleCheguei(pedido)}
                        className="bg-white border border-purple-300 hover:bg-purple-100 text-purple-900 font-bold text-xs py-2 px-3 rounded-lg transition"
                      >
                        Botão Manual: Cheguei na Loja
                      </button>
                    </div>

                    {/* Feedback Geográfico */}
                    {geoFeedback[pedido.id] && (
                      <div className="p-2 bg-white/80 border border-purple-200 text-purple-950 text-xs rounded-lg font-medium">
                        {geoFeedback[pedido.id]}
                      </div>
                    )}
                  </div>
                )}

                {/* Botão de Cancelar Pedido (RF13, CA19) */}
                {podeCancelar && (
                  <div className="pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => cancelarPedidoCliente(pedido.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancelar Pedido (Devolver Estoque - CA19)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
