import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Intervue',
    template: '%s | Intervue',
  },
  description: 'Latihan interview kerja dengan AI interviewer berbasis suara.',
  icons: {
    icon: [
      { url: '/intervue-tab-20260523.ico?v=4', sizes: 'any' },
      { url: '/intervue-tab-20260523.png?v=4', type: 'image/png' },
      { url: '/brand/logo-display.png?v=4', type: 'image/png' },
    ],
    shortcut: '/intervue-tab-20260523.ico?v=4',
    apple: '/intervue-touch-20260523.png?v=4',
  },
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
      <head>
        <link href="/intervue-tab-20260523.ico?v=4" rel="shortcut icon" />
        <link href="/intervue-tab-20260523.ico?v=4" rel="icon" sizes="any" />
        <link href="/intervue-tab-20260523.png?v=4" rel="icon" type="image/png" />
        <link href="/intervue-touch-20260523.png?v=4" rel="apple-touch-icon" />
      </head>
      <body className={`${geist.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
