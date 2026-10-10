import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import SiteFooter from '@/components/SiteFooter/SiteFooter';
import VisitorNoticeSequence from '@/components/VisitorNoticeSequence/VisitorNoticeSequence';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hotdog or Not Hotdog',
  description: "Upload a photo and find out if it's a hotdog.",
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
