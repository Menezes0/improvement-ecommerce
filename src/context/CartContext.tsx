'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Produto, RegraSubstituicao, TipoPedido, ZonaEntrega, Pedido, StatusPedido } from '@/types/database';
import { ZONAS_DEMO } from '@/lib/demo-data';
import { useAuth } from './AuthContext';
import { createClient } from '@/lib/supabase/client';

export interface CartItemWithProduct {
  produto: Produto;
  quantidade: number;
  regra_substituicao: RegraSubstituicao;
  preco_aplicado: number;
}

interface CartContextType {
  itens: CartItemWithProduct[];
  adicionarItem: (produto: Produto, quantidade?: number) => { success: boolean; message?: string };
  atualizarQuantidade: (produtoId: string, novaQuantidade: number) => { success: boolean; message?: string };
  atualizarRegraSubstituicao: (produtoId: string, novaRegra: RegraSubstituicao) => void;
  removerItem: (produtoId: string) => void;
  limparCarrinho: () => void;
  tipoPedido: TipoPedido;
  setTipoPedido: (tipo: TipoPedido) => void;
  zonaSelecionada: ZonaEntrega;
  setZonaSelecionada: (zona: ZonaEntrega) => void;
  subtotal: number;
  frete: number;
  total: number;
  quantidadeTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  finalizarPedido: () => Promise<{ success: boolean; pedidoId?: string; error?: string }>;
  pedidosRealizados: Pedido[];
  cancelarPedidoCliente: (pedidoId: string) => Promise<{ success: boolean; error?: string }>;
  atualizarStatusPedidoOperador: (pedidoId: string, novoStatus: StatusPedido) => Promise<{ success: boolean; error?: string }>;
  atenderAvisoChegadaOperador: (pedidoId: string) => void;
  registrarAvisoAproximacaoCliente: (pedidoId: string, lat: number, lon: number) => Promise<{ distancia_m: number; dentro_do_raio: boolean; aviso_gerado: boolean }>;
  registrarAvisoChegueiCliente: (pedidoId: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth();
  const [itens, setItens] = useState<CartItemWithProduct[]>([]);
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>('entrega');
  const [zonaSelecionada, setZonaSelecionada] = useState<ZonaEntrega>(ZONAS_DEMO[0]); // Olaria padrão
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pedidosRealizados, setPedidosRealizados] = useState<Pedido[]>([]);
  const supabase = createClient();

  // Carregar carrinho e pedidos salvos
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const carrinhoSalvo = localStorage.getItem(`cart_${usuario?.id || 'visitante'}`);
      if (carrinhoSalvo) {
        try {
          setItens(JSON.parse(carrinhoSalvo));
        } catch {
          // Ignora erro
        }
      } else {
        setItens([]);
      }

      const pedidosSalvos = localStorage.getItem('improvement_pedidos_demo');
      if (pedidosSalvos) {
        try {
          setPedidosRealizados(JSON.parse(pedidosSalvos));
        } catch {
          // Ignora erro
        }
      }
    }
  }, [usuario?.id]);

  // Salvar sempre que itens mudarem
  const salvarItens = (novosItens: CartItemWithProduct[]) => {
    setItens(novosItens);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cart_${usuario?.id || 'visitante'}`, JSON.stringify(novosItens));
    }
  };

  // RF08, CA10, CA12: Adicionar ao carrinho
  const adicionarItem = (produto: Produto, quantidadeAdicionar: number = 1) => {
    if (!produto.ativo || produto.estoque <= 0) {
      return { success: false, message: 'Produto indisponível no momento (RF06).' };
    }

    const index = itens.findIndex((i) => i.produto.id === produto.id);
    const preco = produto.preco_promocional && produto.preco_promocional > 0 ? produto.preco_promocional : produto.preco;

    if (index >= 0) {
      const novaQtd = itens[index].quantidade + quantidadeAdicionar;
      if (novaQtd > produto.estoque) {
        return {
          success: false,
          message: `Limite de estoque atingido: apenas ${produto.estoque} unidades disponíveis (CA12).`,
        };
      }
      const copia = [...itens];
      copia[index].quantidade = novaQtd;
      copia[index].preco_aplicado = preco;
      salvarItens(copia);
      return { success: true };
    } else {
      if (quantidadeAdicionar > produto.estoque) {
        return {
          success: false,
          message: `Quantidade solicitada excede o estoque disponível (${produto.estoque} un).`,
        };
      }
      const novoItem: CartItemWithProduct = {
        produto,
        quantidade: quantidadeAdicionar,
        regra_substituicao: 'nao_substituir', // RF09, CA14: padrão "Não substituir"
        preco_aplicado: preco,
      };
      salvarItens([...itens, novoItem]);
      return { success: true };
    }
  };

  // CA12: Alterar quantidade com limite de estoque
  const atualizarQuantidade = (produtoId: string, novaQuantidade: number) => {
    const item = itens.find((i) => i.produto.id === produtoId);
    if (!item) return { success: false };

    if (novaQuantidade <= 0) {
      removerItem(produtoId);
      return { success: true };
    }

    if (novaQuantidade > item.produto.estoque) {
      return {
        success: false,
        message: `Limite de estoque atingido (${item.produto.estoque} un disponíveis). A quantidade anterior foi mantida (CA12).`,
      };
    }

    const novos = itens.map((i) => (i.produto.id === produtoId ? { ...i, quantidade: novaQuantidade } : i));
    salvarItens(novos);
    return { success: true };
  };

  // RF09, CA14: Atualizar regra de substituição
  const atualizarRegraSubstituicao = (produtoId: string, novaRegra: RegraSubstituicao) => {
    const novos = itens.map((i) => (i.produto.id === produtoId ? { ...i, regra_substituicao: novaRegra } : i));
    salvarItens(novos);
  };

  const removerItem = (produtoId: string) => {
    salvarItens(itens.filter((i) => i.produto.id !== produtoId));
  };

  const limparCarrinho = () => {
    salvarItens([]);
  };

  // RF10, CA15: Cálculos de subtotal, frete e total
  const subtotal = itens.reduce((acc, curr) => acc + curr.preco_aplicado * curr.quantidade, 0);
  const frete = tipoPedido === 'retirada' ? 0.0 : zonaSelecionada.taxa_frete;
  const total = subtotal + frete;
  const quantidadeTotal = itens.reduce((acc, curr) => acc + curr.quantidade, 0);

  // RF11, CA16, CA17: Finalizar Pedido
  const finalizarPedido = async (): Promise<{ success: boolean; pedidoId?: string; error?: string }> => {
    if (itens.length === 0) {
      return { success: false, error: 'O carrinho está vazio.' };
    }

    if (!usuario) {
      return { success: false, error: 'Você precisa estar logado para finalizar a compra.' };
    }

    // CA17: Validar se algum item ficou sem estoque
    for (const item of itens) {
      if (item.produto.estoque < item.quantidade) {
        return {
          success: false,
          error: `O item "${item.produto.nome}" não possui mais estoque suficiente (${item.produto.estoque} disponíveis). O checkout foi bloqueado e nada foi gravado (CA17).`,
        };
      }
    }

    // Tentar executar RPC atômico no Supabase se conectado
    try {
      const { data, error } = await supabase.rpc('finalizar_pedido', {
        p_usuario_id: usuario.id,
        p_tipo: tipoPedido,
        p_endereco_id: null,
      });

      if (!error && data) {
        limparCarrinho();
        setIsCartOpen(false);
        return { success: true, pedidoId: data };
      }
    } catch {
      // Segue para fallback simulado
    }

    // Fallback simulado persistente (RF11, CA16)
    const novoPedidoId = `ped-${Date.now().toString(36)}`;
    const novoPedido: Pedido = {
      id: novoPedidoId,
      usuario_id: usuario.id,
      cliente_nome: usuario.nome,
      cliente_email: usuario.email,
      tipo: tipoPedido,
      status: 'recebido',
      subtotal: Math.round(subtotal * 100) / 100,
      frete: Math.round(frete * 100) / 100,
      total: Math.round(total * 100) / 100,
      a_caminho: false,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      itens: itens.map((item) => ({
        id: `it-${Math.random().toString(36).substring(2, 9)}`,
        pedido_id: novoPedidoId,
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_aplicado,
        regra_substituicao: item.regra_substituicao,
        situacao: 'pendente',
        produto: item.produto,
      })),
      endereco:
        tipoPedido === 'entrega'
          ? {
              id: 'end-1',
              usuario_id: usuario.id,
              zona_id: zonaSelecionada.id,
              bairro: zonaSelecionada.bairro,
              taxa_frete: zonaSelecionada.taxa_frete,
              logradouro: 'Av. Farquar',
              numero: '500',
              cep: '76801-000',
              padrao: true,
            }
          : undefined,
    };

    const novosPedidos = [novoPedido, ...pedidosRealizados];
    setPedidosRealizados(novosPedidos);
    if (typeof window !== 'undefined') {
      localStorage.setItem('improvement_pedidos_demo', JSON.stringify(novosPedidos));
    }

    // Atualizar estoque local dos produtos
    for (const item of itens) {
      item.produto.estoque -= item.quantidade;
    }

    limparCarrinho();
    setIsCartOpen(false);
    return { success: true, pedidoId: novoPedidoId };
  };

  // RF13, CA19: Cancelar pedido pelo cliente (apenas status 'recebido')
  const cancelarPedidoCliente = async (pedidoId: string): Promise<{ success: boolean; error?: string }> => {
    const pedido = pedidosRealizados.find((p) => p.id === pedidoId);
    if (!pedido) return { success: false, error: 'Pedido não encontrado.' };

    if (pedido.status !== 'recebido') {
      return {
        success: false,
        error: `O pedido está com status "${pedido.status}". O cancelamento só é permitido enquanto o status for "recebido" (RF13, CA19).`,
      };
    }

    // Estornar estoque dos itens
    if (pedido.itens) {
      for (const it of pedido.itens) {
        if (it.produto) {
          it.produto.estoque += it.quantidade;
        }
      }
    }

    const atualizados = pedidosRealizados.map((p) =>
      p.id === pedidoId ? { ...p, status: 'cancelado' as const, atualizado_em: new Date().toISOString() } : p
    );
    setPedidosRealizados(atualizados);
    if (typeof window !== 'undefined') {
      localStorage.setItem('improvement_pedidos_demo', JSON.stringify(atualizados));
    }

    return { success: true };
  };

  // RF21, CA28: Transição de status pelo operador
  const atualizarStatusPedidoOperador = async (pedidoId: string, novoStatus: StatusPedido): Promise<{ success: boolean; error?: string }> => {
    const pedido = pedidosRealizados.find((p) => p.id === pedidoId);
    if (!pedido) return { success: false, error: 'Pedido não encontrado.' };

    const atual = pedido.status;
    let valido = false;

    // Regras da Seção 6.4:
    if (pedido.tipo === 'retirada') {
      if (
        (atual === 'recebido' && novoStatus === 'em_separacao') ||
        (atual === 'em_separacao' && novoStatus === 'pronto') ||
        (atual === 'pronto' && novoStatus === 'concluido')
      ) {
        valido = true;
      }
    } else {
      if (
        (atual === 'recebido' && novoStatus === 'em_separacao') ||
        (atual === 'em_separacao' && novoStatus === 'saiu_para_entrega') ||
        (atual === 'saiu_para_entrega' && novoStatus === 'concluido')
      ) {
        valido = true;
      }
    }

    if (!valido) {
      return {
        success: false,
        error: `Transição inválida para pedido de ${pedido.tipo}: de "${atual}" para "${novoStatus}" (CA28).`,
      };
    }

    const atualizados = pedidosRealizados.map((p) =>
      p.id === pedidoId ? { ...p, status: novoStatus, atualizado_em: new Date().toISOString() } : p
    );
    setPedidosRealizados(atualizados);
    if (typeof window !== 'undefined') {
      localStorage.setItem('improvement_pedidos_demo', JSON.stringify(atualizados));
    }

    return { success: true };
  };

  // RF17, CA24: Atender aviso de chegada pelo operador
  const atenderAvisoChegadaOperador = (pedidoId: string) => {
    const atualizados = pedidosRealizados.map((p) =>
      p.id === pedidoId ? { ...p, ultima_distancia_m: 0, a_caminho: false } : p
    );
    setPedidosRealizados(atualizados);
    if (typeof window !== 'undefined') {
      localStorage.setItem('improvement_pedidos_demo', JSON.stringify(atualizados));
    }
  };

  // RF14, RF15, CA20, CA21: Geolocation e aproximação
  const registrarAvisoAproximacaoCliente = async (pedidoId: string, lat: number, lon: number) => {
    // Coordenadas da Loja
    const lojaLat = -8.7618;
    const lojaLon = -63.902;
    const raio = 1000;

    // Haversine
    const dLat = ((lat - lojaLat) * Math.PI) / 180;
    const dLon = ((lon - lojaLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lojaLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia_m = Math.round(6371000 * c * 100) / 100;

    const dentro_do_raio = distancia_m <= raio;

    const atualizados = pedidosRealizados.map((p) =>
      p.id === pedidoId
        ? {
            ...p,
            a_caminho: true,
            ultima_distancia_m: distancia_m,
            atualizado_em: new Date().toISOString(),
          }
        : p
    );
    setPedidosRealizados(atualizados);
    if (typeof window !== 'undefined') {
      localStorage.setItem('improvement_pedidos_demo', JSON.stringify(atualizados));
    }

    return {
      distancia_m,
      dentro_do_raio,
      aviso_gerado: dentro_do_raio,
    };
  };

  // RF16, CA23: Manual "Cheguei"
  const registrarAvisoChegueiCliente = async (pedidoId: string) => {
    const atualizados = pedidosRealizados.map((p) =>
      p.id === pedidoId
        ? {
            ...p,
            a_caminho: true,
            ultima_distancia_m: 0,
            atualizado_em: new Date().toISOString(),
          }
        : p
    );
    setPedidosRealizados(atualizados);
    if (typeof window !== 'undefined') {
      localStorage.setItem('improvement_pedidos_demo', JSON.stringify(atualizados));
    }
    return true;
  };

  return (
    <CartContext.Provider
      value={{
        itens,
        adicionarItem,
        atualizarQuantidade,
        atualizarRegraSubstituicao,
        removerItem,
        limparCarrinho,
        tipoPedido,
        setTipoPedido,
        zonaSelecionada,
        setZonaSelecionada,
        subtotal,
        frete,
        total,
        quantidadeTotal,
        isCartOpen,
        setIsCartOpen,
        finalizarPedido,
        pedidosRealizados,
        cancelarPedidoCliente,
        atualizarStatusPedidoOperador,
        atenderAvisoChegadaOperador,
        registrarAvisoAproximacaoCliente,
        registrarAvisoChegueiCliente,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de um CartProvider');
  }
  return context;
}
