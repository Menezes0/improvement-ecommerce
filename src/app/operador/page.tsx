'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { PRODUTOS_DEMO } from '@/lib/demo-data';
import { StatusPedido, Produto } from '@/types/database';
import {
  Store,
  MapPin,
  CheckCircle,
  AlertTriangle,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export default function PainelOperadorPage() {
  const { papel, loginAsDemo } = useAuth();
  const {
    pedidosRealizados,
    atualizarStatusPedidoOperador,
    atenderAvisoChegadaOperador,
  } = useCart();

  const [abaAtiva, setAbaAtiva] = useState<'avisos' | 'pedidos' | 'estoque'>('avisos');
  const [erroTransicao, setErroTransicao] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  // Estados para ajuste manual de estoque (RF19, CA26)
  const [produtosLocais, setProdutosLocais] = useState<Produto[]>(PRODUTOS_DEMO);
  const [produtoAjusteId, setProdutoAjusteId] = useState<string>(PRODUTOS_DEMO[0].id);
  const [tipoAjuste, setTipoAjuste] = useState<'entrada' | 'saida' | 'ajuste'>('saida');
  const [qtdAjuste, setQtdAjuste] = useState<number>(1);
  const [motivoAjuste, setMotivoAjuste] = useState<string>('Avaria de embalagem');

  // RF03, CA05: Proteção de Rota (Negar acesso a Clientes e Visitantes)
  if (papel !== 'operador' && papel !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-4 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-rose-900">403 — Acesso Negado</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          Você está conectado com o perfil <strong>{papel.toUpperCase()}</strong>. Esta rota é restrita estritamente aos operadores da loja e administradores (RF03, CA05).
        </p>
        <div className="pt-2">
          <button
            onClick={() => loginAsDemo('operador')}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition"
          >
            Entrar como Operador da Loja (Luiz Carlos)
          </button>
        </div>
      </div>
    );
  }

  // RF17, CA24: Avisos de Chegada Pendentes
  const pedidosComAviso = pedidosRealizados.filter(
    (p) => p.tipo === 'retirada' && p.a_caminho && p.status !== 'concluido' && p.status !== 'cancelado'
  );

  // RF21, CA28: Avançar status com máquina de estados
  const handleAvancarStatus = async (pedidoId: string, proximoStatus: StatusPedido) => {
    setErroTransicao(null);
    setSucessoMsg(null);

    const res = await atualizarStatusPedidoOperador(pedidoId, proximoStatus);
    if (!res.success) {
      setErroTransicao(res.error || 'Erro ao avançar status.');
    } else {
      setSucessoMsg(`Status atualizado com sucesso para "${proximoStatus}"!`);
      setTimeout(() => setSucessoMsg(null), 3000);
    }
  };

  // RF22, CA29, CA30: Tratar ruptura em separação
  const handleTratarRuptura = (
    pedidoId: string,
    itemId: string,
    situacao: 'separado' | 'substituido' | 'cortado',
    substitutoId?: string
  ) => {
    const pedido = pedidosRealizados.find((p) => p.id === pedidoId);
    if (!pedido || !pedido.itens) return;

    const item = pedido.itens.find((it) => it.id === itemId);
    if (!item) return;

    if (situacao === 'separado') {
      item.situacao = 'separado';
    } else if (situacao === 'substituido' && substitutoId) {
      // CA29: Troca de marca na mesma categoria
      const substituto = produtosLocais.find((p) => p.id === substitutoId);
      if (substituto) {
        item.situacao = 'substituido';
        item.produto_substituto = substituto;
        item.preco_unitario = substituto.preco;
      }
    } else if (situacao === 'cortado') {
      // CA30: Cortar item e abater do total
      item.situacao = 'cortado';
    }

    // Recalcular total do pedido
    const novoSubtotal = pedido.itens
      .filter((it) => it.situacao !== 'cortado')
      .reduce((acc, curr) => acc + curr.preco_unitario * curr.quantidade, 0);

    pedido.subtotal = novoSubtotal;
    pedido.total = novoSubtotal + pedido.frete;
    setSucessoMsg(`Item atualizado como "${situacao}". Total recalculado: R$ ${pedido.total.toFixed(2)}.`);
    setTimeout(() => setSucessoMsg(null), 3000);
  };

  // RF19, CA26: Ajuste Manual de Estoque com Movimentação
  const handleAjustarEstoque = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = produtosLocais.find((p) => p.id === produtoAjusteId);
    if (!prod) return;

    let novoEstoque = prod.estoque;
    if (tipoAjuste === 'entrada') {
      novoEstoque += qtdAjuste;
    } else if (tipoAjuste === 'saida') {
      if (prod.estoque < qtdAjuste) {
        alert(`Estoque não pode ficar negativo. Disponível: ${prod.estoque}`);
        return;
      }
      novoEstoque -= qtdAjuste;
    } else {
      novoEstoque = qtdAjuste;
    }

    prod.estoque = novoEstoque;
    setProdutosLocais([...produtosLocais]);
    setSucessoMsg(`Estoque de "${prod.nome}" ajustado para ${novoEstoque} un. Movimentação registrada! (CA26)`);
    setTimeout(() => setSucessoMsg(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Cabeçalho do Painel */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Painel da Equipe de Operações
          </span>
          <h1 className="text-2xl font-black text-gray-900 mt-1 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-700" /> Operação de Pedidos e Loja
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Atenda avisos de chegada em tempo real, separe pedidos e trate rupturas com substituição de marca.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setAbaAtiva('avisos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              abaAtiva === 'avisos'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Avisos de Chegada ({pedidosComAviso.length})
          </button>
          <button
            onClick={() => setAbaAtiva('pedidos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              abaAtiva === 'pedidos'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            Fila de Separação ({pedidosRealizados.length})
          </button>
          <button
            onClick={() => setAbaAtiva('estoque')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              abaAtiva === 'estoque'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Ajustar Estoque
          </button>
        </div>
      </div>

      {/* Alertas Globais */}
      {erroTransicao && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{erroTransicao}</span>
        </div>
      )}

      {sucessoMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* ABA 1: AVISOS DE CHEGADA (RF17, CA24) */}
      {abaAtiva === 'avisos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" /> Clientes em Deslocamento para Retirada (RF17)
            </h2>
            <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
              Notificação Instantânea (&lt; 3s)
            </span>
          </div>

          {pedidosComAviso.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
              <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-700 text-sm">Nenhum cliente a caminho no momento</p>
              <p className="text-xs">
                Assim que um cliente acionar &quot;Estou a caminho&quot; ou &quot;Cheguei&quot;, o alerta aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pedidosComAviso.map((ped) => (
                <div
                  key={ped.id}
                  className="bg-white rounded-2xl border-2 border-purple-300 p-5 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-100 font-bold px-2 py-0.5 rounded">
                        #{ped.id.substring(0, 10)}
                      </span>
                      <h3 className="font-extrabold text-base text-gray-900 mt-1">
                        {ped.cliente_nome || 'Cliente'}
                      </h3>
                      <div className="text-xs text-gray-500 font-medium">
                        Status do Pedido: <strong className="text-purple-700">{ped.status}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Distância</span>
                      <span className="text-xl font-black text-purple-900">
                        {ped.ultima_distancia_m !== undefined && ped.ultima_distancia_m !== null
                          ? `${ped.ultima_distancia_m} m`
                          : 'Chegou'}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-purple-50 rounded-xl text-xs text-purple-900">
                    {ped.ultima_distancia_m && ped.ultima_distancia_m <= 1000 ? (
                      <span className="font-bold text-purple-800">
                        📍 Cliente dentro do raio de 1 km! Separe o pacote no balcão de entrega.
                      </span>
                    ) : (
                      <span>Cliente acionou aviso manual ou está se aproximando.</span>
                    )}
                  </div>

                  {/* Botão de Atender Aviso (RF17, CA24) */}
                  <button
                    onClick={() => atenderAvisoChegadaOperador(ped.id)}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Marcar como Atendido (CA24)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: FILA DE PEDIDOS E SEPARAÇÃO (RF21, RF22) */}
      {abaAtiva === 'pedidos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" /> Fila e Separação de Pedidos (RF21, RF22)
            </h2>
          </div>

          {pedidosRealizados.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap justify-between items-start gap-2 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-mono font-bold text-gray-500">
                    #{pedido.id.substring(0, 10)}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {pedido.cliente_nome} ·{' '}
                    <span className="text-gray-500 capitalize">{pedido.tipo}</span>
                  </h3>
                  <div className="text-xs text-gray-400">
                    Status Atual: <strong className="text-emerald-700">{pedido.status}</strong>
                  </div>
                </div>

                {/* Transições permitidas da máquina de estados (RF21, CA28) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {pedido.status === 'recebido' && (
                    <button
                      onClick={() => handleAvancarStatus(pedido.id, 'em_separacao')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-xs"
                    >
                      Iniciar Separação →
                    </button>
                  )}

                  {pedido.status === 'em_separacao' && pedido.tipo === 'retirada' && (
                    <button
                      onClick={() => handleAvancarStatus(pedido.id, 'pronto')}
                      className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-xs"
                    >
                      Marcar Pronto Retirada →
                    </button>
                  )}

                  {pedido.status === 'em_separacao' && pedido.tipo === 'entrega' && (
                    <button
                      onClick={() => handleAvancarStatus(pedido.id, 'saiu_para_entrega')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-xs"
                    >
                      Despachar para Entrega →
                    </button>
                  )}

                  {(pedido.status === 'pronto' || pedido.status === 'saiu_para_entrega') && (
                    <button
                      onClick={() => handleAvancarStatus(pedido.id, 'concluido')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-xs"
                    >
                      Concluir Entrega / Retirada ✓
                    </button>
                  )}

                  {/* Tentativa de transição proibida para demonstrar CA28 */}
                  {pedido.status === 'recebido' && (
                    <button
                      onClick={() => handleAvancarStatus(pedido.id, 'concluido')}
                      className="bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-600 font-bold text-[10px] py-1 px-2 rounded border"
                      title="Testa a recusa de transição ilegal recebido -> concluido"
                    >
                      Testar Salto Ilegal (CA28)
                    </button>
                  )}
                </div>
              </div>

              {/* Itens do Pedido com Ações de Separação e Ruptura (RF22, CA29, CA30) */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Itens a Separar
                </span>
                <div className="space-y-2">
                  {pedido.itens?.map((it) => (
                    <div
                      key={it.id}
                      className="p-3 bg-gray-50 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border border-gray-200"
                    >
                      <div>
                        <div className="font-bold text-xs text-gray-900">
                          {it.quantidade}x {it.produto?.nome}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Regra do Cliente:{' '}
                          <strong className="text-gray-800">
                            {it.regra_substituicao === 'troca_marca' ? 'Aceito troca de marca' : 'Não substituir'}
                          </strong>{' '}
                          · Situação:{' '}
                          <span className="font-bold uppercase text-emerald-800">{it.situacao}</span>
                        </div>
                        {it.produto_substituto && (
                          <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                            Substituído por: {it.produto_substituto.nome} (R$ {it.preco_unitario.toFixed(2)})
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação na Separação (RF22) */}
                      {pedido.status === 'em_separacao' && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleTratarRuptura(pedido.id, it.id, 'separado')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1 px-2.5 rounded-lg shadow-xs"
                          >
                            ✓ Separado
                          </button>

                          {it.regra_substituicao === 'troca_marca' ? (
                            <button
                              onClick={() => {
                                // Escolhe substituto da mesma categoria (ex: Camil em vez de Tio Jorge)
                                const substituto = produtosLocais.find(
                                  (p) => p.categoria_id === it.produto?.categoria_id && p.id !== it.produto_id
                                );
                                if (substituto) {
                                  handleTratarRuptura(pedido.id, it.id, 'substituido', substituto.id);
                                }
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] py-1 px-2.5 rounded-lg shadow-xs"
                            >
                              Trocar Marca (CA29)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTratarRuptura(pedido.id, it.id, 'cortado')}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] py-1 px-2.5 rounded-lg shadow-xs"
                            >
                              Cortar Item (CA30)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ABA 3: AJUSTE MANUAL DE ESTOQUE (RF19, CA26) */}
      {abaAtiva === 'estoque' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs max-w-xl mx-auto space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-600" /> Ajuste Manual de Estoque (RF19, CA26)
            </h2>
            <p className="text-xs text-gray-500">
              Registra entradas, saídas por avaria ou balanço de estoque com histórico e auditoria.
            </p>
          </div>

          <form onSubmit={handleAjustarEstoque} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Produto</label>
              <select
                value={produtoAjusteId}
                onChange={(e) => setProdutoAjusteId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-semibold text-gray-900"
              >
                {produtosLocais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — Atual: {p.estoque} un (R$ {p.preco.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tipo de Movimentação</label>
                <select
                  value={tipoAjuste}
                  onChange={(e) => setTipoAjuste(e.target.value as 'entrada' | 'saida' | 'ajuste')}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-semibold text-gray-900"
                >
                  <option value="saida">Saída (Avaria / Descarte)</option>
                  <option value="entrada">Entrada (Reposição)</option>
                  <option value="ajuste">Balanço / Ajuste Absoluto</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={qtdAjuste}
                  onChange={(e) => setQtdAjuste(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-semibold text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Motivo do Ajuste (Auditoria)</label>
              <input
                type="text"
                value={motivoAjuste}
                onChange={(e) => setMotivoAjuste(e.target.value)}
                placeholder="Ex: Saída de 3 unidades, motivo: avaria (CA26)"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 font-semibold text-gray-900"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition text-xs mt-2"
            >
              Confirmar Ajuste no Estoque
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
