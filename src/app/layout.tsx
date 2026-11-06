import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/Navbar';
import { CartDrawer } from '@/components/CartDrawer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Improvement e-commerce — Supermercados Porto Velho',
  description:
    'Módulo web para supermercados regionais com estoque em tempo real, substituições consentidas, frete transparente e Clique e Retire com geolocalização.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
              <div className="max-w-7xl mx-auto px-4 space-y-1">
                <p className="font-semibold text-gray-700">
                  Improvement e-commerce — Prova de conceito acadêmica
                </p>
                <p>
                  IFRO Campus Porto Velho Calama · Autor: Luiz Carlos de Andrade Mascarenhas Alves da Silva
                </p>
                <p className="text-[11px] text-gray-400">
                  Dados 100% simulados para demonstração e conformidade acadêmica (RNF07).
                </p>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
