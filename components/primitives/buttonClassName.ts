import { FOCUS_RING_CLASS_NAME } from './focusRing';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'md' | 'sm';

const BUTTON_VARIANT_CLASS_NAME: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-border-strong bg-surface text-foreground hover:bg-surface-muted',
};

const BUTTON_SIZE_CLASS_NAME: Record<ButtonSize, string> = {
  md: 'px-6',
  sm: 'px-4 text-sm',
};

const BUTTON_BASE_CLASS_NAME =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/** Shared by `Button` and `FilePickerButton`. Every size keeps a 44px minimum touch target. */
export const getButtonShapeClassName = ({
  variant,
  size = 'md',
}: {
  variant: ButtonVariant;
  size?: ButtonSize;
}) => {
  return `${BUTTON_BASE_CLASS_NAME} ${BUTTON_VARIANT_CLASS_NAME[variant]} ${BUTTON_SIZE_CLASS_NAME[size]}`;
};

export const getButtonClassName = (buttonStyle: { variant: ButtonVariant; size?: ButtonSize }) => {
  return `${getButtonShapeClassName(buttonStyle)} ${FOCUS_RING_CLASS_NAME}`;
};
