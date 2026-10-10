import type { HotdogTypes } from '@/shared/types';

import HotdogScoreText from '@/components/HotdogClassificationDetails/HotdogScoreText';

interface HotdogClassificationHistoryItemTitleProps {
  hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord;
}

/** The style and score for a hotdog, what it is otherwise, the reason for legacy results. */
const HotdogClassificationHistoryItemTitle = ({
  hotdogClassificationRecord: { reason, details },
}: HotdogClassificationHistoryItemTitleProps) => {
  if (!details) {
    return reason;
  }

  switch (details.kind) {
    case 'hotdog':
      return (
        <>
          {details.hotdogStyle.name} · <HotdogScoreText score={details.tastiness.score} />
        </>
      );
    case 'notHotdog':
      return details.subject.name;
  }
};

export default HotdogClassificationHistoryItemTitle;
