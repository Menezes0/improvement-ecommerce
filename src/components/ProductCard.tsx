'use client';

import React, { useState } from 'react';
import { Produto } from '@/types/database';
import { useCart } from '@/context/CartContext';
import { ProductImage } from '@/components/ProductImage';
import { Plus, Check, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  produto: Produto;
}

export function ProductCard({ produto }: ProductCardProps) {
  const { adicionarItem } = useCart();
  const [adicionado, setAdicionado] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const temOferta =
    produto.preco_promocional &&
    produto.preco_promocional > 0 &&
    produto.preco_promocional < produto.preco;
  const precoFinal = temOferta ? produto.preco_promocional! : produto.preco;
  const disponivel = produto.ativo && produto.estoque > 0;

  const handleAdicionar = () => {
    setMensagemErro(null);
    const res = adicionarItem(produto, 1);
    if (res.success) {
      setAdicionado(true);
      setTimeout(() => setAdicionado(false), 1200);
    } else if (res.message) {
      setMensagemErro(res.message);
      setTimeout(() => setMensagemErro(null), 3000);
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-200/80 p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 relative">
      {/* Badge de Oferta */}
      {temOferta && (
        <span className="absolute -top-2.5 left-4 z-10 bg-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md">
          Oferta Especial
        </span>
      )}

      <div>
        {/* Imagem do Produto com Fallback Temático */}
        <div className="mb-3">
          <ProductImage
            src={produto.imagem_url}
            alt={produto.nome}
            categoria={produto.categoria_nome}
            className="w-full h-40"
          />
        </div>

        {/* Tags de Restrição Alimentar (RF05, CA07) */}
        <div className="flex flex-wrap gap-1 mb-2">
          {produto.sem_lactose && (
            <span className="bg-sky-50 text-sky-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-sky-200">
              Sem Lactose
            </span>
          )}
          {produto.sem_gluten && (
            <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-amber-200">
              Sem Glúten
            </span>
          )}
          {produto.vegano && (
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-300">
              🌱 Vegano
            </span>
          )}
        </div>

        {/* Marca */}
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
          {produto.marca}
        </span>

        {/* Nome do Produto */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mt-0.5 group-hover:text-emerald-700 transition-colors">
          {produto.nome}
        </h3>

        {/* Descrição */}
        {produto.descricao && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
            {produto.descricao}
          </p>
        )}
      </div>

      {/* Rodapé com Preço, Estoque e Botão */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {/* Indicador de Disponibilidade / Estoque (RF06, CA08) */}
        <div className="flex items-center justify-between text-xs mb-2">
          {disponivel ? (
            <span className="text-emerald-700 font-medium text-[11px]">
              Estoque: <strong>{produto.estoque} un</strong>
            </span>
          ) : (
            <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Indisponível
            </span>
          )}
        </div>

        {/* Preços */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-black text-gray-900">
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
          {temOferta && (
            <span className="text-xs text-gray-400 line-through">
              R$ {produto.preco.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>

        {/* Mensagem de Erro de Estoque (ex: CA12) */}
        {mensagemErro && (
          <div className="mb-2 p-1.5 bg-rose-50 text-rose-700 text-[11px] rounded border border-rose-200 leading-tight">
            {mensagemErro}
          </div>
        )}

        {/* Botão de Adicionar (RF06: desabilitado quando estoque = 0) */}
        <button
          onClick={handleAdicionar}
          disabled={!disponivel}
          className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs ${
            disponivel
              ? adicionado
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {disponivel ? (
            adicionado ? (
              <>
                <Check className="w-4 h-4" /> Adicionado!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Adicionar à Sacola
              </>
            )
          ) : (
            'Indisponível'
          )}
        </button>
      </div>
    </div>
  );
}
