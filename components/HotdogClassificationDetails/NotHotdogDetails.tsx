import type { HotdogTypes } from '@/shared/types';

import HotdogComparisonSection from './HotdogComparisonSection';
import NotHotdogSubjectSection from './NotHotdogSubjectSection';
import NutritionSection from './NutritionSection';

const NOT_FOOD_MESSAGE = "Not edible, so we skipped the nutrition facts. You're welcome.";
const NUTRITION_UNKNOWN_MESSAGE = "We couldn't estimate nutrition for this one.";

const getMissingNutritionMessage = ({ isFood, nutrition }: HotdogTypes.NotHotdogDetails) => {
  if (!isFood) {
    return NOT_FOOD_MESSAGE;
  }

  if (!nutrition) {
    return NUTRITION_UNKNOWN_MESSAGE;
  }
  return undefined;
};

interface NotHotdogNutritionContentProps {
  notHotdogDetails: HotdogTypes.NotHotdogDetails;
}

/** The comparison table already lists the subject's numbers, so it replaces the plain table. */
const NotHotdogNutritionContent = ({ notHotdogDetails }: NotHotdogNutritionContentProps) => {
  const { subject, nutrition, hotdogComparison } = notHotdogDetails;

  if (hotdogComparison) {
    return (
      <HotdogComparisonSection hotdogComparison={hotdogComparison} subjectName={subject.name} />
    );
  }

  if (!nutrition) {
    return null;
  }
  return <NutritionSection columnList={[{ label: 'Per serving', nutrition }]} />;
};

interface NotHotdogDetailsProps {
  notHotdogDetails: HotdogTypes.NotHotdogDetails;
}

const NotHotdogDetails = ({ notHotdogDetails }: NotHotdogDetailsProps) => {
  return (
    <div className="flex flex-col gap-4">
      <NotHotdogSubjectSection
        subject={notHotdogDetails.subject}
        isFood={notHotdogDetails.isFood}
        missingNutritionMessage={getMissingNutritionMessage(notHotdogDetails)}
      />
      <NotHotdogNutritionContent notHotdogDetails={notHotdogDetails} />
    </div>
  );
};

export default NotHotdogDetails;
