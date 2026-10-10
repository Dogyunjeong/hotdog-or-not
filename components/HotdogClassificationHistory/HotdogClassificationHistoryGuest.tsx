'use client';

import { useTranslations } from 'next-intl';

import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import InlineAlert from '@/components/primitives/InlineAlert';
import TextButton from '@/components/primitives/TextButton';

interface HotdogClassificationHistoryGuestProps {
  onEnableHistory: () => void;
}

/** History is off: explain why the list is empty and offer to turn it on. */
const HotdogClassificationHistoryGuest = ({
  onEnableHistory,
}: HotdogClassificationHistoryGuestProps) => {
  const t = useTranslations('history');
  const { isEnableHistoryFailed, openCookieSettings } = useVisitorPrivacy();

  return (
    <div className="flex flex-col gap-3">
      {isEnableHistoryFailed && (
        <InlineAlert
          message={t('guest.enableFailed')}
          action={
            <Button variant="secondary" size="sm" onClick={onEnableHistory}>
              {t('guest.retry')}
            </Button>
          }
        />
      )}
      <Card className="flex flex-col items-center gap-3 text-center">
        <span aria-hidden className="text-3xl">
          🌭
        </span>
        <p className="font-medium">{t('guest.title')}</p>
        <p className="text-sm text-foreground-muted"> {t('guest.description')} </p>
        <div className="flex flex-col items-center gap-1">
          <Button variant="primary" onClick={onEnableHistory}>
            {t('guest.enable')}
          </Button>
          <TextButton variant="standalone" onClick={openCookieSettings}>
            {t('guest.cookieSettings')}
          </TextButton>
        </div>
        <p className="text-xs text-foreground-muted"> {t('guest.note')} </p>
      </Card>
    </div>
  );
};

export default HotdogClassificationHistoryGuest;
