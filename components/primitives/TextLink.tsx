import type { ComponentProps, ReactNode } from 'react';

import { Link } from '@/i18n/navigation';

import { getTextLinkClassName, type TextLinkVariant } from './textLinkClassName';

/** Locale-aware: `href="/cookie-policy"` resolves to `/ko/cookie-policy` on Korean pages. */
interface TextLinkProps extends Omit<ComponentProps<typeof Link>, 'className' | 'children'> {
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
    <Link className={`${getTextLinkClassName(variant)} ${className}`} {...linkProps}>
      {children}
    </Link>
  );
};

export default TextLink;
