'use client';

import React, { useState } from 'react';
import { Produto } from '@/types/database';
import { useCart } from '@/context/CartContext';
import { ProductImage } from '@/components/ProductImage';
import { Plus, Check, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  produto: Produto;
  modoPromocional?: boolean;
}

export function ProductCard({ produto, modoPromocional = false }: ProductCardProps) {
  const { adicionarItem } = useCart();
  const [adicionado, setAdicionado] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const temOferta =
    produto.preco_promocional &&
    produto.preco_promocional > 0 &&
    produto.preco_promocional < produto.preco;
  const precoFinal = temOferta ? produto.preco_promocional! : produto.preco;
  const disponivel = produto.ativo && produto.estoque > 0;
  
  // Percentual de desconto calculado corretamente (Seção E do documento)
  const percentualDesconto = temOferta
    ? Math.round(((produto.preco - produto.preco_promocional!) / produto.preco) * 100)
    : 0;

  const handleAdicionar = (e: React.MouseEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    const res = adicionarItem(produto, 1);
    if (res.success) {
      setAdicionado(true);
      setTimeout(() => setAdicionado(false), 1400);
    } else if (res.message) {
      setMensagemErro(res.message);
      setTimeout(() => setMensagemErro(null), 3000);
    }
  };

  return (
    <div className={`group bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-200 relative ${
      temOferta ? 'ring-1 ring-[#F97316]/30' : ''
    }`}>
      {/* Badge de Desconto em Destaque */}
      {temOferta && (
        <div className="absolute -top-2.5 left-3.5 z-10 flex items-center gap-1 bg-[#F97316] text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md">
          <span>OFERTA</span>
          <span className="bg-white/20 px-1 rounded">-{percentualDesconto}%</span>
        </div>
      )}

      <div>
        {/* Imagem do Produto com Proporção Padronizada */}
        <div className="mb-3 overflow-hidden rounded-xl bg-gray-50">
          <ProductImage
            src={produto.imagem_url}
            alt={produto.nome}
            categoria={produto.categoria_nome}
            className="w-full h-36 sm:h-40"
          />
        </div>

        {/* Tags de Restrição Alimentar (RF05, CA07) */}
        <div className="flex flex-wrap gap-1 mb-2">
          {produto.sem_lactose && (
            <span className="bg-sky-50 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-200/80">
              Sem Lactose
            </span>
          )}
          {produto.sem_gluten && (
            <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200/80">
              Sem Glúten
            </span>
          )}
          {produto.vegano && (
            <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-300">
              🌱 Vegano
            </span>
          )}
        </div>

        {/* Marca */}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
          {produto.marca}
        </span>

        {/* Nome do Produto */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mt-0.5 group-hover:text-[#16803C] transition-colors">
          {produto.nome}
        </h3>

        {/* Descrição curta */}
        {produto.descricao && (
          <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-normal">
            {produto.descricao}
          </p>
        )}
      </div>

      {/* Rodapé com Preço, Estoque e Botão de Ação */}
      <div className="mt-3.5 pt-3 border-t border-gray-100">
        {/* Indicador de Disponibilidade / Estoque (RF06, CA08) */}
        <div className="flex items-center justify-between text-xs mb-1.5">
          {disponivel ? (
            produto.estoque <= 3 ? (
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold text-[10px] border border-amber-200">
                Apenas {produto.estoque} un restando!
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold text-[11px]">
                Estoque: <strong>{produto.estoque} un</strong>
              </span>
            )
          ) : (
            <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Esgotado
            </span>
          )}
        </div>

        {/* Preços com Hierarquia Forte */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className={`text-xl font-black ${temOferta ? 'text-rose-600' : 'text-gray-900'}`}>
            R$ {precoFinal.toFixed(2).replace('.', ',')}
          </span>
          {temOferta && (
            <span className="text-xs text-gray-400 line-through font-semibold">
              R$ {produto.preco.toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>

        {/* Mensagem de Erro de Estoque (ex: CA12) */}
        {mensagemErro && (
          <div className="mb-2 p-1.5 bg-rose-50 text-rose-700 text-[11px] rounded-lg border border-rose-200 leading-tight">
            {mensagemErro}
          </div>
        )}

        {/* Botão de Adicionar à Sacola */}
        <button
          onClick={handleAdicionar}
          disabled={!disponivel}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
            disponivel
              ? adicionado
                ? 'bg-emerald-600 text-white shadow-inner scale-98'
                : temOferta || modoPromocional
                  ? 'bg-[#16803C] hover:bg-[#14532D] text-white hover:shadow-md cursor-pointer'
                  : 'bg-[#16803C] hover:bg-[#14532D] text-white hover:shadow-md cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {disponivel ? (
            adicionado ? (
              <>
                <Check className="w-4 h-4 animate-in zoom-in-50" /> Na Sacola!
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
