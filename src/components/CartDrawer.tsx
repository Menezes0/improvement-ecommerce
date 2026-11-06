'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ZONAS_DEMO } from '@/lib/demo-data';
import { RegraSubstituicao } from '@/types/database';
import { X, Trash2, Plus, Minus, Bike, Store, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const {
    itens,
    isCartOpen,
    setIsCartOpen,
    atualizarQuantidade,
    atualizarRegraSubstituicao,
    removerItem,
    tipoPedido,
    setTipoPedido,
    zonaSelecionada,
    setZonaSelecionada,
    subtotal,
    frete,
    total,
    finalizarPedido,
  } = useCart();

  const { usuario } = useAuth();
  const router = useRouter();
  const [erroCheckout, setErroCheckout] = useState<string | null>(null);
  const [sucessoCheckout, setSucessoCheckout] = useState<string | null>(null);
  const [isProcessando, setIsProcessando] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    setErroCheckout(null);
    setSucessoCheckout(null);

    if (!usuario) {
      setIsCartOpen(false);
      router.push('/login?retorno=/');
      return;
    }

    setIsProcessando(true);
    const res = await finalizarPedido();
    setIsProcessando(false);

    if (res.success) {
      setSucessoCheckout(`Pedido ${res.pedidoId} realizado com sucesso!`);
      setTimeout(() => {
        setIsCartOpen(false);
        router.push('/pedidos');
      }, 1500);
    } else {
      setErroCheckout(res.error || 'Erro ao finalizar o pedido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Sua Sacola de Compras</h2>
              <span className="text-xs text-gray-500 font-medium">
                {itens.length} {itens.length === 1 ? 'item' : 'itens'} no carrinho
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {itens.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <span className="text-5xl mb-3">🛒</span>
                <p className="font-bold text-gray-700">Sua sacola está vazia</p>
                <p className="text-xs mt-1">Navegue pelo catálogo ou pelo mural de ofertas para adicionar itens.</p>
              </div>
            ) : (
              itens.map((item) => {
                const subtotalItem = item.preco_aplicado * item.quantidade;
                return (
                  <div
                    key={item.produto.id}
                    className="p-3 bg-white border border-gray-200 rounded-xl space-y-2.5 shadow-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {item.produto.marca}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">
                          {item.produto.nome}
                        </h4>
                        <div className="text-xs font-extrabold text-emerald-800 mt-0.5">
                          R$ {item.preco_aplicado.toFixed(2).replace('.', ',')}{' '}
                          <span className="text-[10px] font-normal text-gray-500">/un</span>
                        </div>
                      </div>

                      <button
                        onClick={() => removerItem(item.produto.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Remover item do carrinho"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Controles de Quantidade e Subtotal do Item */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Seletor de Quantidade (+ / - com limite de estoque - CA12) */}
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                          className="p-1 hover:bg-gray-200 text-gray-600 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-extrabold text-gray-900">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                          className="p-1 hover:bg-gray-200 text-gray-600 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-800">
                          R$ {subtotalItem.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    {/* RF09, CA14: Regra de Substituição por Item */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <label className="text-[11px] text-gray-500 font-medium">
                        Em caso de falta:
                      </label>
                      <select
                        value={item.regra_substituicao}
                        onChange={(e) =>
                          atualizarRegraSubstituicao(item.produto.id, e.target.value as RegraSubstituicao)
                        }
                        className="text-[11px] font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:ring-emerald-500"
                      >
                        <option value="nao_substituir">Não substituir (Padrão)</option>
                        <option value="troca_marca">Aceito troca de marca</option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer com Opções de Frete e Checkout */}
          {itens.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
              {/* RF10, CA15: Seletor Entrega x Retirada */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Modalidade de Recebimento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoPedido('entrega')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      tipoPedido === 'entrega'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bike className="w-4 h-4" /> Entrega
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoPedido('retirada')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      tipoPedido === 'retirada'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Store className="w-4 h-4" /> Retirada (R$ 0,00)
                  </button>
                </div>
              </div>

              {/* Se entrega, selecionar Bairro de Porto Velho (RF04, RF10, CA15) */}
              {tipoPedido === 'entrega' && (
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700">Bairro de Entrega (PVH):</span>
                    <select
                      value={zonaSelecionada.id}
                      onChange={(e) => {
                        const z = ZONAS_DEMO.find((zona) => zona.id === e.target.value);
                        if (z) setZonaSelecionada(z);
                      }}
                      className="text-xs font-bold text-emerald-800 bg-gray-50 border border-gray-300 rounded px-2 py-1"
                    >
                      {ZONAS_DEMO.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.bairro} (R$ {z.taxa_frete.toFixed(2).replace('.', ',')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-[11px] text-gray-500 flex justify-between">
                    <span>Prazo estimado:</span>
                    <span className="font-semibold">{zonaSelecionada.prazo_estimado_min} minutos</span>
                  </div>
                </div>
              )}

              {/* Totais (RF10, CA15) */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span>
                    {frete === 0 ? (
                      <strong className="text-emerald-700">Grátis (Retirada)</strong>
                    ) : (
                      `R$ ${frete.toFixed(2).replace('.', ',')}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-gray-900 pt-1 border-t">
                  <span>Total</span>
                  <span className="text-emerald-800">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Feedback de Erro ou Sucesso */}
              {erroCheckout && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{erroCheckout}</span>
                </div>
              )}

              {sucessoCheckout && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{sucessoCheckout}</span>
                </div>
              )}

              {/* Botão de Finalizar */}
              <button
                onClick={handleCheckout}
                disabled={isProcessando}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isProcessando ? (
                  'Processando compra atômica...'
                ) : (
                  <>
                    <span>Finalizar Pedido</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-gray-400">
                🔒 Pagamento simulado na entrega ou na retirada (conforme escopo acadêmico).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
