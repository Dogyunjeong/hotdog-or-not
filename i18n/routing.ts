import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ko'],
  defaultLocale: 'en',
  // Always `/en/...` or `/ko/...`: `/` redirects once by Accept-Language, and an explicit
  // locale in the URL always wins. (With `as-needed` and no cookie, a Korean browser could
  // never choose English: `/` would keep redirecting to `/ko`.)
  localePrefix: 'always',
  // No `NEXT_LOCALE` cookie: the URL carries the language, so nothing is stored without consent.
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];
