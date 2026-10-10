import type { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import HotdogComparisonSection from './HotdogComparisonSection';
import NotHotdogSubjectSection from './NotHotdogSubjectSection';
import NutritionSection from './NutritionSection';

interface NotHotdogNutritionContentProps {
  notHotdogDetails: HotdogTypes.NotHotdogDetails;
}

/** The comparison table already lists the subject's numbers, so it replaces the plain table. */
const NotHotdogNutritionContent = ({ notHotdogDetails }: NotHotdogNutritionContentProps) => {
  const t = useTranslations('details');
  const { subject, nutrition, hotdogComparison } = notHotdogDetails;

  if (hotdogComparison) {
    return (
      <HotdogComparisonSection hotdogComparison={hotdogComparison} subjectName={subject.name} />
    );
  }

  if (!nutrition) {
    return null;
  }
  return <NutritionSection columnList={[{ label: t('nutrition.perServing'), nutrition }]} />;
};

interface NotHotdogDetailsProps {
  notHotdogDetails: HotdogTypes.NotHotdogDetails;
}

const NotHotdogDetails = ({ notHotdogDetails }: NotHotdogDetailsProps) => {
  const t = useTranslations('details');

  const getMissingNutritionMessage = () => {
    if (!notHotdogDetails.isFood) {
      return t('notHotdog.notEdible');
    }

    if (!notHotdogDetails.nutrition) {
      return t('notHotdog.nutritionUnknown');
    }
    return undefined;
  };

  return (
    <div className="flex flex-col gap-4">
      <NotHotdogSubjectSection
        subject={notHotdogDetails.subject}
        isFood={notHotdogDetails.isFood}
        missingNutritionMessage={getMissingNutritionMessage()}
      />
      <NotHotdogNutritionContent notHotdogDetails={notHotdogDetails} />
    </div>
  );
};

export default NotHotdogDetails;
