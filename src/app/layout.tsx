import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Velco — Odontología Especializada',
  description: 'Tratamientos dentales de alta calidad con tecnología de vanguardia. Diseñamos sonrisas que transforman vidas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`scroll-smooth ${playfair.variable} ${inter.variable}`}>
      <body className="bg-bone-50 text-khaki-900 antialiased">{children}</body>
    </html>
  );
}
