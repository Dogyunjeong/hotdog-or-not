import type { HotdogTypes } from '@seamflow/shared-types';

interface HotdogVerdictProps {
  hotdogClassification: HotdogTypes.HotdogClassification;
}

const HotdogVerdict = ({ hotdogClassification }: HotdogVerdictProps) => {
  const { isHotdog, reason } = hotdogClassification;

  return (
    <div
      role="status"
      className={`rounded-2xl p-4 text-center text-white ${isHotdog ? 'bg-green-600' : 'bg-red-600'}`}
    >
      <p className="text-2xl font-bold">{isHotdog ? 'Hotdog ✅' : 'Not hotdog ❌'}</p>
      <p className="mt-1 text-sm text-white/90">{reason}</p>
    </div>
  );
};

export default HotdogVerdict;
