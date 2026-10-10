import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import SiteFooter from '@/components/SiteFooter/SiteFooter';
import VisitorNoticeSequence from '@/components/VisitorNoticeSequence/VisitorNoticeSequence';

import { SITE_CANVAS_COLOR, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from './site.config';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Icons and the share image come from file conventions in `app/` (favicon.ico, icon.svg,
// apple-icon.png, opengraph-image.png) and the web app manifest from `app/manifest.ts`.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SITE_CANVAS_COLOR.light },
    { media: '(prefers-color-scheme: dark)', color: SITE_CANVAS_COLOR.dark },
  ],
};

const RootLayout = ({ children }: LayoutProps<'/'>) => {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-canvas font-sans text-foreground">
        {children}
        <SiteFooter />
        <VisitorNoticeSequence />
      </body>
    </html>
  );
};

export default RootLayout;
