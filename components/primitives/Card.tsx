import type { ReactNode } from 'react';

type CardPadding = 'md' | 'sm';

const CARD_PADDING_CLASS_NAME: Record<CardPadding, string> = {
  md: 'p-4',
  sm: 'p-3',
};

interface CardProps {
  as?: 'section' | 'div' | 'li';
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
}

const Card = ({ as: CardElement = 'div', padding = 'md', className = '', children }: CardProps) => {
  return (
    <CardElement
      className={`rounded-card border border-border bg-surface ${CARD_PADDING_CLASS_NAME[padding]} ${className}`}
    >
      {children}
    </CardElement>
  );
};

export default Card;
