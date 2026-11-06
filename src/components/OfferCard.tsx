'use client';

import React, { useState } from 'react';
import { Oferta } from '@/types/database';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ProductImage } from '@/components/ProductImage';
import { useRouter } from 'next/navigation';
import { Zap, Check, Clock } from 'lucide-react';

interface OfferCardProps {
  oferta: Oferta;
}

export function OfferCard({ oferta }: OfferCardProps) {
  const { adicionarItem } = useCart();
  const { usuario } = useAuth();
  const router = useRouter();
  const [adicionado, setAdicionado] = useState(false);

  if (!oferta.produto) return null;

  const produto = oferta.produto;
  const precoNormal = produto.preco;
  const precoPromocional = oferta.preco_promocional;
  const descontoPercentual = Math.round(((precoNormal - precoPromocional) / precoNormal) * 100);

  // Formatar data de validade
  const dataValidade = new Date(oferta.fim).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });

  const handleComprarUmClique = () => {
    // RF07: Se não estiver logado, redirecionar ao login
    if (!usuario) {
      router.push('/login?retorno=/ofertas');
      return;
    }

    // Criar objeto produto com o preço promocional aplicado
    const produtoComOferta = {
      ...produto,
      preco_promocional: precoPromocional,
    };

    const res = adicionarItem(produtoComOferta, 1);
    if (res.success) {
      setAdicionado(true);
      setTimeout(() => setAdicionado(false), 1200);
    }
  };

  return (
    <div className="group bg-gradient-to-br from-amber-500/10 via-white to-rose-500/5 rounded-2xl border-2 border-amber-300 p-4 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-200 relative overflow-hidden">
      {/* Badge de Desconto */}
      <div className="absolute top-3 right-3 z-10 bg-rose-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-md">
        -{descontoPercentual}%
      </div>

      <div>
        <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1 mb-2">
          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Oferta do Mural
        </div>

        {/* Imagem do Produto da Oferta */}
        <div className="mb-3">
          <ProductImage
            src={produto.imagem_url}
            alt={produto.nome}
            categoria={produto.categoria_nome}
            className="w-full h-36"
          />
        </div>

        {/* Tags de Restrição Alimentar */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          {produto.sem_lactose && (
            <span className="bg-sky-50 text-sky-700 text-[9px] font-semibold px-1.5 py-0.5 rounded">
              Sem Lactose
            </span>
          )}
          {produto.sem_gluten && (
            <span className="bg-amber-50 text-amber-700 text-[9px] font-semibold px-1.5 py-0.5 rounded">
              Sem Glúten
            </span>
          )}
          {produto.vegano && (
            <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
              🌱 Vegano
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-gray-900 text-sm leading-snug group-hover:text-amber-800 transition-colors">
          {produto.nome}
        </h3>
        <span className="text-xs text-gray-500 font-semibold">{produto.marca}</span>

        {/* Validade da Oferta (RF07) */}
        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-2">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Válido até <strong>{dataValidade}</strong></span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-amber-200/60">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-black text-rose-600">
            R$ {precoPromocional.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-xs text-gray-400 line-through">
            R$ {precoNormal.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Botão em Um Clique (RF07, CA10) */}
        <button
          onClick={handleComprarUmClique}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
            adicionado
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {adicionado ? (
            <>
              <Check className="w-4 h-4" /> Adicionado por R$ {precoPromocional.toFixed(2).replace('.', ',')}!
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" /> Adicionar em 1 Clique
            </>
          )}
        </button>
      </div>
    </div>
  );
}
