import type { HotdogTypes } from '@/shared/types';

import HotdogClassificationDetails from '@/components/HotdogClassificationDetails/HotdogClassificationDetails';

import GuestResultNote from './GuestResultNote';

interface HotdogClassificationResultDetailsProps {
  hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord;
}

/**
 * Everything under the verdict. Kept outside the status live region so screen readers
 * announce the verdict, not every detail card.
 */
const HotdogClassificationResultDetails = ({
  hotdogClassificationRecord,
}: HotdogClassificationResultDetailsProps) => {
  const isGuestResult = hotdogClassificationRecord.id === null;

  return (
    <div className="flex flex-col gap-4 motion-safe:animate-status-enter">
      {isGuestResult && <GuestResultNote />}
      <HotdogClassificationDetails details={hotdogClassificationRecord.details} />
    </div>
  );
};

export default HotdogClassificationResultDetails;
