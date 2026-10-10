import type { HotdogTypes } from '@/shared/types';

import {
  formatHotdogScore,
  formatHotdogScoreForScreenReader,
} from '@/components/HotdogClassificationDetails/detailsFormat';

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
          {details.hotdogStyle.name} ·{' '}
          <span aria-hidden>{formatHotdogScore(details.tastiness.score)}</span>
          <span className="sr-only">
            {formatHotdogScoreForScreenReader(details.tastiness.score)}
          </span>
        </>
      );
    case 'notHotdog':
      return details.subject.name;
  }
};

export default HotdogClassificationHistoryItemTitle;
