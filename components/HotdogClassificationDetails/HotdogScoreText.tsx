import { HotdogTypes } from '@/shared/types';
import { useFormatter, useTranslations } from 'next-intl';

import { DECIMAL_NUMBER_FORMAT_OPTIONS } from './detailsFormat';

interface HotdogScoreTextProps {
  score: number;
  className?: string;
}

/** Shows "8.5/10"; screen readers hear "8.5 out of 10". */
const HotdogScoreText = ({ score, className = '' }: HotdogScoreTextProps) => {
  const t = useTranslations('details');
  const format = useFormatter();
  const scoreMessageValues = {
    score: format.number(score, DECIMAL_NUMBER_FORMAT_OPTIONS),
    max: HotdogTypes.HOTDOG_SCORE_MAX,
  };

  return (
    <span className={`tabular-nums ${className}`}>
      <span aria-hidden>{t('score', scoreMessageValues)}</span>
      <span className="sr-only">{t('scoreForScreenReader', scoreMessageValues)}</span>
    </span>
  );
};

export default HotdogScoreText;
