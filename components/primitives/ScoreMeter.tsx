type ScoreMeterSize = 'sm' | 'lg';

const SCORE_METER_SIZE_CLASS_NAME: Record<ScoreMeterSize, string> = {
  sm: 'h-1.5',
  lg: 'h-2.5',
};

interface ScoreMeterProps {
  score: number;
  max?: number;
  size: ScoreMeterSize;
}

/** Decorative bar; the caller renders the readable "7.5/10" text next to it. */
const ScoreMeter = ({ score, max = 10, size }: ScoreMeterProps) => {
  const safeScore = Number.isFinite(score) ? score : 0;
  const fillPercent = Math.min(100, Math.max(0, (safeScore / max) * 100));

  return (
    <div
      aria-hidden
      className={`w-full overflow-hidden rounded-control bg-surface-muted ${SCORE_METER_SIZE_CLASS_NAME[size]}`}
    >
      <div className="h-full rounded-control bg-primary" style={{ width: `${fillPercent}%` }} />
    </div>
  );
};

export default ScoreMeter;
