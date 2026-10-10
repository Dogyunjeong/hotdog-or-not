import type { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import ScoreMeter from '@/components/primitives/ScoreMeter';

import DetailSection from './DetailSection';
import HotdogScoreText from './HotdogScoreText';

interface HotdogTastinessBreakdownItemProps {
  breakdownEntry: HotdogTypes.HotdogTastiness['breakdown'][number];
}

const HotdogTastinessBreakdownItem = ({ breakdownEntry }: HotdogTastinessBreakdownItemProps) => {
  const t = useTranslations('details');

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{t(`tastiness.aspect.${breakdownEntry.aspect}`)}</span>
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
  const t = useTranslations('details');

  return (
    <DetailSection title={t('tastiness.title')} className={className}>
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
