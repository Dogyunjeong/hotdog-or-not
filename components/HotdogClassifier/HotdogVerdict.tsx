import type { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

interface HotdogVerdictProps {
  hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord;
}

const HotdogVerdictTitle = ({ isHotdog }: { isHotdog: boolean }) => {
  const t = useTranslations('classifier.verdict');

  if (isHotdog) {
    return (
      <p className="text-2xl font-bold">
        <span aria-hidden>🌭 </span>
        {t('hotdog')}
      </p>
    );
  }
  return (
    <p className="text-2xl font-bold">
      {t.rich('notHotdog', {
        srOnly: (punctuation) => <span className="sr-only">{punctuation}</span>,
      })}
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
