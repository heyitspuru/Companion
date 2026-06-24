import type { Metadata } from 'next';
import { Black_Ops_One, Russo_One, Chakra_Petch } from 'next/font/google';
import './globals.css';

const blackOps = Black_Ops_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-black-ops',
  display: 'swap',
});

const russo = Russo_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-russo',
  display: 'swap',
});

const chakra = Chakra_Petch({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-chakra',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Companion — Outwork Yesterday',
  description: 'Gamified accountability. Build streaks, earn badges, grow with your circle.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${blackOps.variable} ${russo.variable} ${chakra.variable}`}
    >
      <body className="bg-bg text-paragraph font-body antialiased">{children}</body>
    </html>
  );
}
