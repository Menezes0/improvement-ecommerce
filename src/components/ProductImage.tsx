'use client';

import React, { useState } from 'react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  categoria?: string;
  className?: string;
}

export function ProductImage({ src, alt, categoria, className = 'w-full h-36' }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ícone e gradiente temático de fallback por categoria
  const getCategoryTheme = (cat?: string) => {
    switch (cat) {
      case 'Carnes e Aves':
        return { emoji: '🥩', bg: 'from-rose-100 to-red-200 text-rose-800' };
      case 'Higiene Pessoal':
        return { emoji: '🧴', bg: 'from-cyan-100 to-blue-200 text-cyan-800' };
      case 'Laticínios e Frios':
        return { emoji: '🧀', bg: 'from-amber-100 to-yellow-200 text-amber-800' };
      case 'Mercearia Básica':
        return { emoji: '🌾', bg: 'from-orange-100 to-amber-200 text-orange-800' };
      case 'Hortifrúti':
        return { emoji: '🍎', bg: 'from-emerald-100 to-green-200 text-emerald-800' };
      case 'Padaria e Confeitaria':
        return { emoji: '🍞', bg: 'from-yellow-100 to-amber-200 text-yellow-900' };
      case 'Bebidas':
        return { emoji: '🥤', bg: 'from-purple-100 to-indigo-200 text-purple-800' };
      case 'Limpeza':
        return { emoji: '🧼', bg: 'from-teal-100 to-cyan-200 text-teal-800' };
      case 'Dietas e Saudáveis':
        return { emoji: '🥗', bg: 'from-lime-100 to-emerald-200 text-emerald-900' };
      default:
        return { emoji: '🛒', bg: 'from-gray-100 to-gray-200 text-gray-700' };
    }
  };

  const theme = getCategoryTheme(categoria);

  if (!src || hasError) {
    return (
      <div
        className={`${className} bg-gradient-to-br ${theme.bg} rounded-xl flex flex-col items-center justify-center p-3 text-center border border-black/5 shadow-inner transition-transform group-hover:scale-102`}
      >
        <span className="text-4xl filter drop-shadow-sm mb-1">{theme.emoji}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 line-clamp-1">
          {categoria || 'Produto'}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center group`}>
      {isLoading && (
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} animate-pulse flex items-center justify-center`}>
          <span className="text-3xl opacity-50">{theme.emoji}</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}
