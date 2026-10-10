type SpinnerSize = 'sm' | 'md';

const SPINNER_SIZE_CLASS_NAME: Record<SpinnerSize, string> = {
  sm: 'size-4 border-2',
  md: 'size-10 border-4',
};

interface SpinnerProps {
  size: SpinnerSize;
}

/** Decorative only — pair it with text that says what is loading. Takes the current text color. */
const Spinner = ({ size }: SpinnerProps) => {
  return (
    <span
      aria-hidden
      className={`inline-block rounded-full border-current border-t-transparent motion-safe:animate-spin ${SPINNER_SIZE_CLASS_NAME[size]}`}
    />
  );
};

export default Spinner;
