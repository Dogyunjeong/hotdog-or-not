import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import SiteFooter from '@/components/SiteFooter/SiteFooter';
import VisitorNoticeSequence from '@/components/VisitorNoticeSequence/VisitorNoticeSequence';
import VisitorPrivacyProvider from '@/components/VisitorPrivacy/VisitorPrivacyProvider';
import { type AppLocale, routing } from '@/i18n/routing';

import { SITE_CANVAS_COLOR, SITE_URL } from '../site.config';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};

const OPEN_GRAPH_LOCALE: Record<AppLocale, string> = {
  en: 'en_GB',
  ko: 'ko_KR',
};

// Icons and the share image come from file conventions in `app/` (favicon.ico, icon.svg,
// apple-icon.png, opengraph-image.png) and the web app manifest from `app/manifest.ts`.
export const generateMetadata = async ({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> => {
  const { locale } = await params;
  const metadataLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: metadataLocale, namespace: 'common' });
  const appName = t('appName');
  const appDescription = t('appDescription');
  return {
    metadataBase: new URL(SITE_URL),
    title: appName,
    description: appDescription,
    applicationName: appName,
    openGraph: {
      type: 'website',
      siteName: appName,
      title: appName,
      description: appDescription,
      locale: OPEN_GRAPH_LOCALE[metadataLocale],
    },
    twitter: {
      card: 'summary_large_image',
      title: appName,
      description: appDescription,
    },
  };
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SITE_CANVAS_COLOR.light },
    { media: '(prefers-color-scheme: dark)', color: SITE_CANVAS_COLOR.dark },
  ],
};

const LocaleLayout = async ({ children, params }: LayoutProps<'/[locale]'>) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Lets server components below render this locale statically.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas font-sans text-foreground">
        <NextIntlClientProvider>
          <VisitorPrivacyProvider>
            {children}
            <SiteFooter />
            <VisitorNoticeSequence />
          </VisitorPrivacyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

export default LocaleLayout;
