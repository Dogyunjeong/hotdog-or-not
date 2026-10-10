import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import HotdogClassificationWorkspace from '@/components/HotdogClassificationWorkspace/HotdogClassificationWorkspace';
import PageContainer from '@/components/primitives/PageContainer';
import { routing } from '@/i18n/routing';

const HomePage = async ({ params }: PageProps<'/[locale]'>) => {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations('common');

  return (
    <PageContainer width="wide">
      <header className="space-y-2 text-center">
        {/* Focus target after the visitor's data is erased (the privacy provider moves it here). */}
        <h1 tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
          {t('appName')}
        </h1>
        <p className="text-foreground-muted">{t('tagline')}</p>
      </header>
      <HotdogClassificationWorkspace />
    </PageContainer>
  );
};

export default HomePage;
