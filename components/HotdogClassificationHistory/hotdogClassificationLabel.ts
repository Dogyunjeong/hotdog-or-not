import type { HotdogTypes } from '@/shared/types';
import { useFormatter, useTranslations } from 'next-intl';

/**
 * History renders on the client only, so show times in the visitor's own zone — not the
 * server/build zone next-intl would otherwise pass down (e.g. UTC on Vercel).
 */
const getVisitorTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Locale-aware labels shared by the history cards and the detail view. */
export const useHotdogClassificationLabel = () => {
  const t = useTranslations('history');
  const format = useFormatter();

  const formatHotdogClassificationCreatedAt = (createdAt: string) => {
    return format.dateTime(new Date(createdAt), {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: getVisitorTimeZone(),
    });
  };

  const getHotdogClassificationVerdictLabel = (isHotdog: boolean) => {
    return isHotdog ? t('verdict.hotdog') : t('verdict.notHotdog');
  };

  /** Detail heading, e.g. "Hotdog · Oct 10, 2026". */
  const getHotdogClassificationDetailTitle = ({
    isHotdog,
    createdAt,
  }: HotdogTypes.HotdogClassificationRecord) => {
    return t('detailTitle', {
      verdict: getHotdogClassificationVerdictLabel(isHotdog),
      date: format.dateTime(new Date(createdAt), {
        dateStyle: 'medium',
        timeZone: getVisitorTimeZone(),
      }),
    });
  };

  return {
    formatHotdogClassificationCreatedAt,
    getHotdogClassificationVerdictLabel,
    getHotdogClassificationDetailTitle,
  };
};
