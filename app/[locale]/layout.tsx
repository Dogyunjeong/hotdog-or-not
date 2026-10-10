import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import SiteFooter from '@/components/SiteFooter/SiteFooter';
import VisitorNoticeSequence from '@/components/VisitorNoticeSequence/VisitorNoticeSequence';
import VisitorPrivacyProvider from '@/components/VisitorPrivacy/VisitorPrivacyProvider';
import { routing } from '@/i18n/routing';

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

export const generateMetadata = async ({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: 'common',
  });
  return {
    title: t('appName'),
    description: t('appDescription'),
  };
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
