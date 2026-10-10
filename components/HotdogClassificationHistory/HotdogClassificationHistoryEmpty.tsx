import Card from '@/components/primitives/Card';

const HotdogClassificationHistoryEmpty = () => {
  return (
    <Card className="flex flex-col items-center gap-2 text-center">
      <span aria-hidden className="text-3xl">
        🌭
      </span>
      <p className="font-medium">No photos yet</p>
      <p className="text-sm text-foreground-muted">
        Upload your first photo and your verdicts will show up here.
      </p>
    </Card>
  );
};

export default HotdogClassificationHistoryEmpty;
