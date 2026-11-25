import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MPC & EPC Enterprise CRM — Governance, Tender, Kontrak & BAST Digital',
  description:
    'Sistem Enterprise CRM Proyek EPC & Master Planned Community Indonesia berstandar ISO/IEC 27001:2022, ISO 9001:2015, ITIL v4, PMBOK 7, UU PDP, e-Meterai PERURI, PSrE & Coretax DJP.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
