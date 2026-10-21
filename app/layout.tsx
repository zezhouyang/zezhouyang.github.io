import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { themeInitScript } from '@/lib/theme';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const title = 'Zezhou Yang | The University of Hong Kong';
const description =
  'Zezhou Yang is a Ph.D. student at The University of Hong Kong, working on repository-level documentation generation, code optimization, and AI safety.';

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL('https://zezhouyang.github.io'),
  icons: { icon: { url: '/spider.svg', type: 'image/svg+xml' } },
  openGraph: { title, description, type: 'website', locale: 'en_US' },
  twitter: { card: 'summary', title, description },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
