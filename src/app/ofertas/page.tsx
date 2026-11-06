'use client';

import React, { useMemo } from 'react';
import { OFERTAS_DEMO } from '@/lib/demo-data';
import { OfferCard } from '@/components/OfferCard';
import { Sparkles, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MuralOfertasPage() {
  // RF07, CA11: Apenas ofertas ativas e vigentes (terminadas não aparecem)
  const ofertasVigentes = useMemo(() => {
    const agora = new Date();
    return OFERTAS_DEMO.filter((o) => {
      const fim = new Date(o.fim);
      const inicio = new Date(o.inicio);
      return o.ativa && agora >= inicio && agora <= fim;
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Catálogo
        </Link>
        <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Compra em 1 clique (RF07)
        </span>
      </div>

      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="bg-amber-900/60 text-amber-100 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> Mural de Ofertas
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
          Super Ofertas Vigentes de Porto Velho
        </h1>
        <p className="text-sm text-amber-100 max-w-xl">
          Preços promocionais direto do encarte digital. Adicione à sua sacola em apenas um clique com o desconto aplicado automaticamente.
        </p>
      </div>

      {/* Grid de Ofertas */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ofertasVigentes.map((oferta) => (
            <OfferCard key={oferta.id} oferta={oferta} />
          ))}
        </div>
      </div>
    </div>
  );
}
