import Button from '@/components/primitives/Button';
import InlineAlert from '@/components/primitives/InlineAlert';

interface HotdogClassificationFailureProps {
  errorMessage: string;
  canRetry: boolean;
  onRetry: () => void;
}

const HotdogClassificationFailure = ({
  errorMessage,
  canRetry,
  onRetry,
}: HotdogClassificationFailureProps) => {
  return (
    <InlineAlert
      message={errorMessage}
      // Announced once by the surrounding polite status region.
      isLiveRegion={false}
      action={
        canRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    />
  );
};

export default HotdogClassificationFailure;
