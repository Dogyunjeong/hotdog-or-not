import { FOCUS_RING_CLASS_NAME } from './focusRing';

export type TextLinkVariant = 'inline' | 'standalone';

const TEXT_LINK_VARIANT_CLASS_NAME: Record<TextLinkVariant, string> = {
  inline: '',
  // Links that stand on their own get a 44px touch target.
  standalone: 'inline-flex min-h-11 items-center',
};

/** Shared by `TextLink` (navigation) and `TextButton` (actions styled as links). */
export const getTextLinkClassName = (variant: TextLinkVariant) => {
  return `rounded-sm text-foreground underline underline-offset-4 hover:text-foreground-muted ${TEXT_LINK_VARIANT_CLASS_NAME[variant]} ${FOCUS_RING_CLASS_NAME}`;
};
