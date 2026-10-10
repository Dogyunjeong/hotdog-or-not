import type { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import DetailSection from './DetailSection';

interface FoodBadgeProps {
  isFood: boolean;
}

const FoodBadge = ({ isFood }: FoodBadgeProps) => {
  const t = useTranslations('details');
  const foodBadgeClassName = isFood
    ? 'bg-accent-soft text-accent-soft-foreground'
    : 'bg-surface-muted text-foreground-muted';

  return (
    <span
      className={`shrink-0 rounded-control px-2 py-0.5 text-xs font-semibold ${foodBadgeClassName}`}
    >
      {isFood ? t('notHotdog.food') : t('notHotdog.notFood')}
    </span>
  );
};

interface NotHotdogSubjectSectionProps {
  subject: HotdogTypes.NotHotdogDetails['subject'];
  isFood: boolean;
  /** Why there are no nutrition facts, when there aren't any. */
  missingNutritionMessage?: string;
}

const NotHotdogSubjectSection = ({
  subject,
  isFood,
  missingNutritionMessage,
}: NotHotdogSubjectSectionProps) => {
  const t = useTranslations('details');

  return (
    <DetailSection title={t('notHotdog.subjectTitle')}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{subject.name}</p>
          <FoodBadge isFood={isFood} />
        </div>
        <p className="text-sm text-foreground-muted">{subject.description}</p>
      </div>
      {missingNutritionMessage && <p className="text-sm">{missingNutritionMessage}</p>}
    </DetailSection>
  );
};

export default NotHotdogSubjectSection;
