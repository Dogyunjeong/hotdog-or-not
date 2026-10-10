'use client';

import { useTranslations } from 'next-intl';

import TextButton from '@/components/primitives/TextButton';
import TextLink from '@/components/primitives/TextLink';
import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';
import LanguageSwitcher from './LanguageSwitcher';

const FooterSeparator = ({ className = '' }: { className?: string }) => {
  return (
    <span aria-hidden className={className}>
      ·
    </span>
  );
};

/** Privacy controls and the language switcher on every page; "Delete my data" also explains itself for guests. */
const SiteFooter = () => {
  const t = useTranslations('footer');
  const { openCookieSettings, openDeleteAllData } = useVisitorPrivacy();

  return (
    <footer className="flex flex-col flex-wrap items-center justify-center gap-x-2 gap-y-0 px-4 py-6 text-sm text-foreground-muted sm:flex-row">
      <p>{t('copyright')}</p>
      {/* Mobile: the copyright sits on its own line, so no leading separator. */}
      <FooterSeparator className="hidden sm:inline" />
      <nav
        aria-label={t('privacyNavLabel')}
        className="flex flex-wrap items-center justify-center gap-x-2"
      >
        <TextLink variant="standalone" href="/cookie-policy">
          {t('cookiePolicy')}
        </TextLink>
        <FooterSeparator />
        <TextButton variant="standalone" onClick={openCookieSettings}>
          {t('cookieSettings')}
        </TextButton>
        <FooterSeparator />
        <TextButton variant="standalone" onClick={openDeleteAllData}>
          {t('deleteMyData')}
        </TextButton>
      </nav>
      <FooterSeparator className="hidden sm:inline" />
      <LanguageSwitcher />
    </footer>
  );
};

export default SiteFooter;
