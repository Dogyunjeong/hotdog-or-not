import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';

import { getTextLinkClassName, type TextLinkVariant } from './textLinkClassName';

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
    <Link className={`${getTextLinkClassName(variant)} ${className}`} {...linkProps}>
      {children}
    </Link>
  );
};

export default TextLink;
