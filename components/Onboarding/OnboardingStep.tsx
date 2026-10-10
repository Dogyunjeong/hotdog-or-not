interface OnboardingStepProps {
  stepNumber: number;
  title: string;
  description: string;
}

const OnboardingStep = ({ stepNumber, title, description }: OnboardingStepProps) => {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-soft-foreground"
      >
        {stepNumber}
      </span>
      <div className="space-y-0.5">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-foreground-muted">{description}</p>
      </div>
    </li>
  );
};

export default OnboardingStep;
