import type enMessages from '@/messages/en';

import type { routing } from './routing';

// Typed `t('namespace.key')` calls and locales, checked against the English messages.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof enMessages;
  }
}
