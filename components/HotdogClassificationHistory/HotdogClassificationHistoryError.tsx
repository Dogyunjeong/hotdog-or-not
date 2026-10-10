import Button from '@/components/primitives/Button';
import InlineAlert from '@/components/primitives/InlineAlert';

interface HotdogClassificationHistoryErrorProps {
  onRetry: () => void;
}

const HotdogClassificationHistoryError = ({ onRetry }: HotdogClassificationHistoryErrorProps) => {
  return (
    <InlineAlert
      message="We couldn't load your history right now."
      action={
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
};

export default HotdogClassificationHistoryError;
