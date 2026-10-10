import type { HotdogTypes } from '@/shared/types';

import ScoreMeter from '@/components/primitives/ScoreMeter';

import DetailSection from './DetailSection';
import {
  formatHotdogScore,
  formatHotdogScoreForScreenReader,
  HOTDOG_TASTINESS_ASPECT_LABEL,
} from './detailsFormat';

interface HotdogScoreTextProps {
  score: number;
  className: string;
}

/** Shows "8.5/10"; screen readers hear "8.5 out of 10". */
const HotdogScoreText = ({ score, className }: HotdogScoreTextProps) => {
  return (
    <span className={`tabular-nums ${className}`}>
      <span aria-hidden>{formatHotdogScore(score)}</span>
      <span className="sr-only">{formatHotdogScoreForScreenReader(score)}</span>
    </span>
  );
};

interface HotdogTastinessBreakdownItemProps {
  breakdownEntry: HotdogTypes.HotdogTastiness['breakdown'][number];
}

const HotdogTastinessBreakdownItem = ({ breakdownEntry }: HotdogTastinessBreakdownItemProps) => {
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{HOTDOG_TASTINESS_ASPECT_LABEL[breakdownEntry.aspect]}</span>
        <HotdogScoreText score={breakdownEntry.score} className="text-foreground-muted" />
      </div>
      <ScoreMeter score={breakdownEntry.score} size="sm" />
      <p className="text-sm text-foreground-muted">{breakdownEntry.comment}</p>
    </li>
  );
};

interface HotdogTastinessSectionProps {
  tastiness: HotdogTypes.HotdogTastiness;
  className?: string;
}

const HotdogTastinessSection = ({ tastiness, className }: HotdogTastinessSectionProps) => {
  return (
    <DetailSection title="Taste-o-meter" className={className}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <HotdogScoreText score={tastiness.score} className="text-4xl font-bold" />
          <p className="font-medium">{tastiness.headline}</p>
        </div>
        <ScoreMeter score={tastiness.score} size="lg" />
      </div>
      {tastiness.breakdown.length > 0 && (
        <ul role="list" className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
          {tastiness.breakdown.map((breakdownEntry) => (
            <HotdogTastinessBreakdownItem
              key={breakdownEntry.aspect}
              breakdownEntry={breakdownEntry}
            />
          ))}
        </ul>
      )}
    </DetailSection>
  );
};

export default HotdogTastinessSection;
