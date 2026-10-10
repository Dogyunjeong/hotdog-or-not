import type { MetadataRoute } from 'next';

import { routing } from '@/i18n/routing';

import { SITE_URL } from './site.config';

const SITEMAP_PAGE_LIST = [
  { path: '', changeFrequency: 'monthly', priority: 1 },
  { path: '/cookie-policy', changeFrequency: 'yearly', priority: 0.3 },
] as const;

// Every page exists once per locale (`localePrefix: 'always'`); each entry lists its translations.
const sitemap = (): MetadataRoute.Sitemap => {
  return SITEMAP_PAGE_LIST.flatMap(({ path, changeFrequency, priority }) => {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]),
    );
    return routing.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
};

export default sitemap;
