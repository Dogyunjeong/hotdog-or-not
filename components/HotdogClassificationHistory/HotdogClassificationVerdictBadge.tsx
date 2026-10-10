import { getHotdogClassificationVerdictLabel } from './hotdogClassificationLabel';

interface HotdogClassificationVerdictBadgeProps {
  isHotdog: boolean;
}

const HotdogClassificationVerdictBadge = ({ isHotdog }: HotdogClassificationVerdictBadgeProps) => {
  const verdictBadgeClassName = isHotdog
    ? 'bg-hotdog-yes-soft text-hotdog-yes-soft-foreground'
    : 'bg-hotdog-no-soft text-hotdog-no-soft-foreground';

  return (
    <span
      className={`shrink-0 rounded-control px-2 py-0.5 text-xs font-semibold ${verdictBadgeClassName}`}
    >
      {getHotdogClassificationVerdictLabel(isHotdog)}
    </span>
  );
};

export default HotdogClassificationVerdictBadge;
