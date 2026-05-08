import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Intervue',
  description: 'Latihan interview kerja dengan AI interviewer berbasis suara.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
