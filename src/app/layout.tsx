import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clínica Dental — Reserva tu Consulta',
  description: 'Agenda tu consulta dental con nuestros especialistas. Atención personalizada y profesional.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
