'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Truck, 
  Store, 
  HeartHandshake, 
  Sparkles
} from 'lucide-react';
import { CATEGORIAS_DEMO } from '@/lib/demo-data';

export function Footer() {
  return (
    <footer className="bg-[#17231B] text-[#F8FAF7] border-t border-emerald-950/40">
      {/* Faixa de Atendimento e Destaques Rápidos */}
      <div className="border-b border-emerald-900/40 bg-[#121c15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800/60 border border-emerald-700/40 flex items-center justify-center shrink-0 text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Frete Fixo e Transparente</p>
                <p className="text-[11px] text-gray-400">Tabelado por bairro de Porto Velho</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800/60 border border-emerald-700/40 flex items-center justify-center shrink-0 text-emerald-400">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Clique & Retire com Aviso</p>
                <p className="text-[11px] text-gray-400">Aviso automático a 1 km da loja</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800/60 border border-emerald-700/40 flex items-center justify-center shrink-0 text-emerald-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Substituição Consentida</p>
                <p className="text-[11px] text-gray-400">Você escolhe: troca ou corte no valor</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800/60 border border-emerald-700/40 flex items-center justify-center shrink-0 text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">Estoque em Tempo Real</p>
                <p className="text-[11px] text-gray-400">Sincronização em menos de 3 segundos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal do Rodapé */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Coluna 1: Marca & Identidade */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#16803C] text-white flex items-center justify-center font-black text-xl shadow-md">
                IE
              </div>
              <div>
                <div className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                  Improvement <span className="text-[#F97316] font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-[#F97316]/10 border border-[#F97316]/20">Supermercados</span>
                </div>
                <p className="text-[11px] text-emerald-300 font-medium">
                  Porto Velho · Rondônia
                </p>
              </div>
            </Link>

            <p className="text-xs text-gray-300 leading-relaxed max-w-sm">
              Sua experiência definitiva de supermercado digital. Produtos frescos selecionados, carnes de primeira linha, ampla variedade de dietas especiais e entregas rápidas na porta da sua casa.
            </p>

            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Rua Duque de Caxias, 1240 · Centro / Olaria, Porto Velho - RO</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Segunda a Sábado: 07h às 22h · Domingos e Feriados: 08h às 20h</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>SAC & Televendas: (69) 3217-0000 · WhatsApp: (69) 99201-0001</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>atendimento@improvementsupermercados.com.br</span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Departamentos */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
              Departamentos
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              {CATEGORIAS_DEMO.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/?cat=${cat.id}`} className="hover:text-emerald-300 transition">
                    {cat.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Dietas & Ofertas */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
              Especiais & Ofertas
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li>
                <Link href="/ofertas" className="hover:text-amber-300 transition flex items-center gap-1 text-amber-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Mural de Ofertas
                </Link>
              </li>
              <li>
                <Link href="/?filtro=sem-lactose" className="hover:text-sky-300 transition">
                  Linha Sem Lactose
                </Link>
              </li>
              <li>
                <Link href="/?filtro=sem-gluten" className="hover:text-amber-300 transition">
                  Linha Sem Glúten
                </Link>
              </li>
              <li>
                <Link href="/?filtro=vegano" className="hover:text-emerald-300 transition">
                  Linha 100% Vegana
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="hover:text-emerald-300 transition">
                  Acompanhar Meu Pedido
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="hover:text-emerald-300 transition">
                  Criar Conta Cliente
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Segurança & Pagamentos */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400">
              Pagamento & Segurança
            </h4>
            <p className="text-[11px] text-gray-300">
              Pagamento 100% seguro na entrega ou na retirada:
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-gray-300">
              <span className="bg-emerald-950/80 border border-emerald-800/60 px-2 py-1 rounded font-medium">PIX Instantâneo</span>
              <span className="bg-emerald-950/80 border border-emerald-800/60 px-2 py-1 rounded font-medium">Crédito & Débito</span>
              <span className="bg-emerald-950/80 border border-emerald-800/60 px-2 py-1 rounded font-medium">Vale Alimentação</span>
              <span className="bg-emerald-950/80 border border-emerald-800/60 px-2 py-1 rounded font-medium">Dinheiro</span>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Ambiente Seguro com Criptografia SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Faixa Inferior de Direitos e Conformidade Acadêmica */}
      <div className="bg-[#0e1610] border-t border-emerald-950/80 py-4 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[11px]">
            © {new Date().getFullYear()} Improvement Supermercados Ltda. Todos os direitos reservados. Porto Velho - RO.
          </p>
          <p className="text-[10px] text-gray-400">
            Projeto e-commerce · IFRO Campus Porto Velho Calama · Autor: Luiz Carlos de Andrade (RNF07)
          </p>
        </div>
      </div>
    </footer>
  );
}
