import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Card from '@/components/primitives/Card';
import PageContainer from '@/components/primitives/PageContainer';
import { getTextLinkClassName } from '@/components/primitives/textLinkClassName';
import CookieSettingsButton from '@/components/VisitorPrivacy/CookieSettingsButton';
import { getPathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const COOKIE_CATEGORY_LIST = [
  { categoryKey: 'essential', cookieName: 'cc_cookie' },
  { categoryKey: 'history', cookieName: 'hotdog_or_not_visitor_session' },
] as const;

const PRIVACY_NOTE_KEY_LIST = [
  'locationRemoved',
  'openAiVerdict',
  'geocoding',
  'noTracking',
  'deleteAnytime',
] as const;

export const generateStaticParams = () => {
  return routing.locales.map((locale) => ({ locale }));
};

export const generateMetadata = async ({
  params,
}: PageProps<'/[locale]/cookie-policy'>): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: 'cookiePolicy',
  });
  return { title: t('metadataTitle') };
};

// TODO: Replace with the full cookie and privacy policy once its content is written.
const CookiePolicyPage = async ({ params }: PageProps<'/[locale]/cookie-policy'>) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const t = await getTranslations('cookiePolicy');

  return (
    <PageContainer>
      {/*
        A full page load on purpose (not next/link): visitors arrive here from the cookie banner,
        and the home page must start its banner → onboarding sequence fresh (blocking banner).
      */}
      <a
        href={getPathname({ href: '/', locale })}
        className={`${getTextLinkClassName('standalone')} self-start text-sm`}
      >
        {t('backLink')}
      </a>
      <header className="space-y-2">
        {/* Focused after "Delete my data" (tabIndex -1), like the home page heading. */}
        <h1 tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
          {t('heading')}
        </h1>
        <p className="text-foreground-muted">{t('summary')}</p>
      </header>
      {COOKIE_CATEGORY_LIST.map((cookieCategory) => (
        <Card key={cookieCategory.cookieName} as="section" className="space-y-2">
          <h2 className="font-semibold">{t(`categories.${cookieCategory.categoryKey}.title`)}</h2>
          <p>
            <code className="font-mono text-sm">{cookieCategory.cookieName}</code>
          </p>
          <p className="text-foreground-muted">
            {t(`categories.${cookieCategory.categoryKey}.description`)}
          </p>
        </Card>
      ))}
      <ul className="list-disc space-y-2 pl-5">
        {PRIVACY_NOTE_KEY_LIST.map((privacyNoteKey) => (
          <li key={privacyNoteKey}>{t(`notes.${privacyNoteKey}`)}</li>
        ))}
      </ul>
      <p>
        <CookieSettingsButton label={t('changeCookieSettings')} />
      </p>
      <p className="text-sm text-foreground-muted">{t('updateNotice')}</p>
    </PageContainer>
  );
};

export default CookiePolicyPage;
