import type { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import StatTable from '@/components/primitives/StatTable';

import DetailSection from './DetailSection';
import { useHotdogNutritionFormat } from './detailsFormat';

interface HotdogComparisonOverallWinnerProps {
  overallWinner: HotdogTypes.HotdogComparisonWinner;
  subjectName: string;
}

const HotdogComparisonOverallWinner = ({
  overallWinner,
  subjectName,
}: HotdogComparisonOverallWinnerProps) => {
  const t = useTranslations('details');

  switch (overallWinner) {
    case 'hotdog':
      return (
        <p className="font-semibold">
          {t.rich('comparison.winnerHotdog', {
            emoji: () => <span aria-hidden>🌭 </span>,
          })}
        </p>
      );
    case 'subject':
      return (
        <p className="font-semibold">{t('comparison.winnerSubject', { subject: subjectName })}</p>
      );
    case 'tie':
      return <p className="font-semibold">{t('comparison.tie')}</p>;
  }
};

interface HotdogComparisonSectionProps {
  hotdogComparison: HotdogTypes.HotdogNutritionComparison;
  subjectName: string;
}

const HotdogComparisonSection = ({
  hotdogComparison,
  subjectName,
}: HotdogComparisonSectionProps) => {
  const t = useTranslations('details');
  const { getNutrientColumnLabel, getNutritionMetricLabel, formatNutritionValue } =
    useHotdogNutritionFormat();

  return (
    <DetailSection title={t('comparison.title', { subject: subjectName })}>
      <div className="flex flex-col gap-1">
        {hotdogComparison.verdictLine && <p>{hotdogComparison.verdictLine}</p>}
        <HotdogComparisonOverallWinner
          overallWinner={hotdogComparison.overallWinner}
          subjectName={subjectName}
        />
      </div>
      <StatTable
        caption={t('comparison.caption')}
        isCaptionVisible
        columnHeaderList={['', t('comparison.averageHotdog'), subjectName]}
        rowHeaderLabel={getNutrientColumnLabel()}
        rowList={hotdogComparison.metricList.map(
          ({ metric, hotdogValue, subjectValue, winner }) => ({
            header: getNutritionMetricLabel(metric),
            cellList: [
              {
                value: formatNutritionValue(metric, hotdogValue),
                isHighlighted: winner === 'hotdog',
                srSuffix: t('comparison.winnerSuffix'),
              },
              {
                value: formatNutritionValue(metric, subjectValue),
                isHighlighted: winner === 'subject',
                srSuffix: t('comparison.winnerSuffix'),
              },
            ],
          }),
        )}
      />
      <p className="text-xs text-foreground-muted">{t('comparison.disclaimer')}</p>
    </DetailSection>
  );
};

export default HotdogComparisonSection;
