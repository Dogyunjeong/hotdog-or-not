import type { HotdogTypes } from '@/shared/types';

import HotdogDetails from './HotdogDetails';
import LegacyDetailsNotice from './LegacyDetailsNotice';
import NotHotdogDetails from './NotHotdogDetails';

interface HotdogClassificationDetailsContentProps {
  details: HotdogTypes.HotdogClassificationDetails | null;
}

const HotdogClassificationDetailsContent = ({
  details,
}: HotdogClassificationDetailsContentProps) => {
  if (!details) {
    return <LegacyDetailsNotice />;
  }

  switch (details.kind) {
    case 'hotdog':
      return <HotdogDetails hotdogDetails={details} />;
    case 'notHotdog':
      return <NotHotdogDetails notHotdogDetails={details} />;
  }
};

interface HotdogClassificationDetailsProps {
  /** `null` for results saved before v0.3 (verdict-only). */
  details: HotdogTypes.HotdogClassificationDetails | null;
}

/**
 * The full details of one result — inline under the verdict, in the desktop panel, and in
 * the mobile drawer. Its own container query picks one or two columns, so no variant prop.
 */
const HotdogClassificationDetails = ({ details }: HotdogClassificationDetailsProps) => {
  return (
    <div className="@container flex flex-col gap-4">
      <HotdogClassificationDetailsContent details={details} />
    </div>
  );
};

export default HotdogClassificationDetails;
