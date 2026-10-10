import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';

import { FOCUS_RING_CLASS_NAME } from './focusRing';

type TextLinkVariant = 'inline' | 'standalone';

const TEXT_LINK_VARIANT_CLASS_NAME: Record<TextLinkVariant, string> = {
  inline: '',
  // Links that stand on their own get a 44px touch target.
  standalone: 'inline-flex min-h-11 items-center',
};

interface TextLinkProps extends LinkProps<string> {
  variant?: TextLinkVariant;
  className?: string;
  children: ReactNode;
}

const TextLink = ({
  variant = 'inline',
  className = '',
  children,
  ...linkProps
}: TextLinkProps) => {
  return (
    <Link
      className={`rounded-sm text-foreground underline underline-offset-4 hover:text-foreground-muted ${TEXT_LINK_VARIANT_CLASS_NAME[variant]} ${FOCUS_RING_CLASS_NAME} ${className}`}
      {...linkProps}
    >
      {children}
    </Link>
  );
};

export default TextLink;
