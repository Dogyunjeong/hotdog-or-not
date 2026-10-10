import { useTranslations } from 'next-intl';

import Spinner from '@/components/primitives/Spinner';
import { useHotdogClassificationProgressMessage } from '@/hooks/useHotdogClassificationProgressMessage';

type HotdogClassificationProgressStep = 'uploading' | 'classifying';

const HotdogImageUploadingProgress = () => {
  const t = useTranslations('classifier.progress');

  return (
    <p className="flex items-center justify-center gap-2 text-foreground-muted">
      <Spinner size="sm" />
      {t('uploading')}
    </p>
  );
};

/**
 * Lives inside the classifier's polite status region: screen readers hear the first message
 * and the "still thinking" note once, never every rotation.
 */
const HotdogImageCheckingProgress = () => {
  const t = useTranslations('classifier.progress');
  const { announcedProgressMessage, rotatingProgressMessage, isStillThinking } =
    useHotdogClassificationProgressMessage();

  return (
    <div className="flex flex-col items-center gap-1 text-center text-foreground-muted">
      <p className="flex items-center justify-center gap-2">
        <Spinner size="sm" />
        <span aria-hidden>{rotatingProgressMessage}</span>
        <span className="sr-only">{announcedProgressMessage}</span>
      </p>
      {isStillThinking && <p className="text-sm">{t('stillThinking')}</p>}
    </div>
  );
};

interface HotdogClassificationProgressProps {
  step: HotdogClassificationProgressStep;
}

const HotdogClassificationProgress = ({ step }: HotdogClassificationProgressProps) => {
  switch (step) {
    case 'uploading':
      return <HotdogImageUploadingProgress />;
    case 'classifying':
      return <HotdogImageCheckingProgress />;
  }
};

export default HotdogClassificationProgress;
