import type { HotdogTypes } from '@/shared/types';

import StatTable from '@/components/primitives/StatTable';

import DetailSection from './DetailSection';
import {
  formatHotdogNutritionValue,
  HOTDOG_NUTRITION_METRIC_LABEL,
  NUTRIENT_COLUMN_LABEL,
} from './detailsFormat';

const WINNER_SR_SUFFIX = ', wins';

interface HotdogComparisonOverallWinnerProps {
  overallWinner: HotdogTypes.HotdogComparisonWinner;
  subjectName: string;
}

const HotdogComparisonOverallWinner = ({
  overallWinner,
  subjectName,
}: HotdogComparisonOverallWinnerProps) => {
  switch (overallWinner) {
    case 'hotdog':
      return (
        <p className="font-semibold">
          Winner: <span aria-hidden>🌭 </span>the hotdog
        </p>
      );
    case 'subject':
      return <p className="font-semibold">Winner: {subjectName}</p>;
    case 'tie':
      return <p className="font-semibold">It&apos;s a tie.</p>;
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
  return (
    <DetailSection title={`Hotdog vs. ${subjectName}`}>
      <div className="flex flex-col gap-1">
        {hotdogComparison.verdictLine && <p>{hotdogComparison.verdictLine}</p>}
        <HotdogComparisonOverallWinner
          overallWinner={hotdogComparison.overallWinner}
          subjectName={subjectName}
        />
      </div>
      <StatTable
        caption="Lower calories, fat, carbs and sodium win. More protein wins."
        isCaptionVisible
        columnHeaderList={['', 'Avg. hotdog', subjectName]}
        rowHeaderLabel={NUTRIENT_COLUMN_LABEL}
        rowList={hotdogComparison.metricList.map(
          ({ metric, hotdogValue, subjectValue, winner }) => ({
            header: HOTDOG_NUTRITION_METRIC_LABEL[metric],
            cellList: [
              {
                value: formatHotdogNutritionValue(metric, hotdogValue),
                isHighlighted: winner === 'hotdog',
                srSuffix: WINNER_SR_SUFFIX,
              },
              {
                value: formatHotdogNutritionValue(metric, subjectValue),
                isHighlighted: winner === 'subject',
                srSuffix: WINNER_SR_SUFFIX,
              },
            ],
          }),
        )}
      />
      <p className="text-xs text-foreground-muted">
        Compared with an average hotdog. Rough estimates.
      </p>
    </DetailSection>
  );
};

export default HotdogComparisonSection;
