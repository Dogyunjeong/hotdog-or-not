import type { HotdogTypes } from '@/shared/types';

interface HotdogVerdictProps {
  hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord;
}

const HotdogVerdictTitle = ({ isHotdog }: { isHotdog: boolean }) => {
  if (isHotdog) {
    return (
      <p className="text-2xl font-bold">
        <span aria-hidden>🌭 </span>Hotdog!
      </p>
    );
  }
  return (
    <p className="text-2xl font-bold">
      Not hotdog<span className="sr-only">.</span>
    </p>
  );
};

const HotdogVerdict = ({ hotdogClassificationRecord }: HotdogVerdictProps) => {
  const { isHotdog, reason } = hotdogClassificationRecord;

  return (
    <div
      className={`rounded-card p-4 text-center text-on-hotdog ${isHotdog ? 'bg-hotdog-yes' : 'bg-hotdog-no'}`}
    >
      <HotdogVerdictTitle isHotdog={isHotdog} />
      <p className="mt-1 text-sm">{reason}</p>
    </div>
  );
};

export default HotdogVerdict;
