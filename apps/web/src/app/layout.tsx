import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Intervue',
    template: '%s | Intervue',
  },
  description: 'Latihan interview kerja dengan AI interviewer berbasis suara.',
  openGraph: {
    title: 'Intervue',
    description: 'Latihan interview kerja dengan AI interviewer berbasis suara.',
    type: 'website',
  },
};

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geist.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
