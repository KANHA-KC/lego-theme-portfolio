import type { Metadata, Viewport } from 'next';
import { Urbanist, Fraunces, Plus_Jakarta_Sans, Playfair_Display, Fira_Code } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import LiquidGlassMount from '@/components/LiquidGlassMount';
import { ToastProvider } from '@/components/Toast';

const urbanist = Urbanist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-urbanist',
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
});

const instagramSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instagram-sans',
  weight: ['400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700'],
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
  weight: ['400', '500', '600'],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://kanha-portfolio.vercel.app');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  title: 'Studio — Designer, Writer, Product Thinker',
  description: 'I turn complex ideas into simple, intuitive experiences.',
  keywords: [
    'UI/UX Design',
    'Product Design',
    'AI Interaction Design',
    'Systems Architecture',
    'Design Engineering',
  ],
  authors: [{ name: 'Studio' }],
  icons: {
    icon: [
      {
        url: '/Final.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/Final Dark.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    shortcut: '/Final.png',
    apple: '/Final.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#f4efe6',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-version="v2"
      className={`${urbanist.variable} ${instagramSans.variable} ${playfair.variable} ${firaCode.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ToastProvider>
          <CustomCursor />
          <LiquidGlassMount />
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
