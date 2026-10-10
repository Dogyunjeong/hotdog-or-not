import type { HotdogTypes } from '@/shared/types';

import DetailSection from './DetailSection';
import { formatHotdogCount } from './detailsFormat';

interface HotdogStyleSectionProps {
  hotdogStyle: HotdogTypes.HotdogDetails['hotdogStyle'];
  hotdogCount: number;
}

const HotdogStyleSection = ({ hotdogStyle, hotdogCount }: HotdogStyleSectionProps) => {
  return (
    <DetailSection title="The style">
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{hotdogStyle.name}</p>
        <p className="text-sm text-foreground-muted">{hotdogStyle.description}</p>
      </div>
      <p className="text-sm">{formatHotdogCount(hotdogCount)}</p>
    </DetailSection>
  );
};

export default HotdogStyleSection;
