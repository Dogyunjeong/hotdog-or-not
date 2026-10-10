'use client';

import { useLocale, useTranslations } from 'next-intl';

import { getTextLinkClassName } from '@/components/primitives/textLinkClassName';
import { getPathname, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * One link per language. Plain `<a>` (a full page load) on purpose: the cookie consent library
 * keeps its language and callbacks for the whole page load, so a client-side switch would leave
 * the banner and Cookie settings in the old language.
 */
const LanguageSwitcher = () => {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const tCommon = useTranslations('common');

  return (
    <nav aria-label={tCommon('languageSwitcherLabel')} className="flex items-center gap-x-2">
      {routing.locales.map((locale) => (
        <a
          key={locale}
          href={getPathname({ href: pathname, locale })}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === currentLocale ? 'true' : undefined}
          className={`${getTextLinkClassName('standalone')} aria-[current=true]:font-semibold aria-[current=true]:no-underline`}
        >
          {tCommon(`languageName.${locale}`)}
        </a>
      ))}
    </nav>
  );
};

export default LanguageSwitcher;
