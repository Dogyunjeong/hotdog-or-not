'use client';

import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

import Button from '@/components/primitives/Button';
import Card from '@/components/primitives/Card';
import InlineAlert from '@/components/primitives/InlineAlert';
import TextButton from '@/components/primitives/TextButton';

interface HotdogClassificationHistoryGuestProps {
  onEnableHistory: () => void;
}

/** History is off: explain why the list is empty and offer to turn it on. */
const HotdogClassificationHistoryGuest = ({
  onEnableHistory,
}: HotdogClassificationHistoryGuestProps) => {
  const { isEnableHistoryFailed, openCookieSettings } = useVisitorPrivacy();

  return (
    <div className="flex flex-col gap-3">
      {isEnableHistoryFailed && (
        <InlineAlert
          message="We couldn't turn on history right now."
          action={
            <Button variant="secondary" size="sm" onClick={onEnableHistory}>
              Try again
            </Button>
          }
        />
      )}
      <Card className="flex flex-col items-center gap-3 text-center">
        <span aria-hidden className="text-3xl">
          🌭
        </span>
        <p className="font-medium">History is off</p>
        <p className="text-sm text-foreground-muted">
          You chose not to save anything, so your verdicts disappear when you leave. Turn on history
          to keep your photos and results in this browser.
        </p>
        <div className="flex flex-col items-center gap-1">
          <Button variant="primary" onClick={onEnableHistory}>
            Turn on history
          </Button>
          <TextButton variant="standalone" onClick={openCookieSettings}>
            Cookie settings
          </TextButton>
        </div>
        <p className="text-xs text-foreground-muted">
          Checks from before you turn it on won&apos;t be saved.
        </p>
      </Card>
    </div>
  );
};

export default HotdogClassificationHistoryGuest;
