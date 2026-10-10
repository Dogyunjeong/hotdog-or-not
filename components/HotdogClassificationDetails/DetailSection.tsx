import type { ReactNode } from 'react';

import Card from '@/components/primitives/Card';

interface DetailSectionProps {
  title: ReactNode;
  className?: string;
  children: ReactNode;
}

/** One card of the details; `className` lets a section span the full grid width. */
const DetailSection = ({ title, className = '', children }: DetailSectionProps) => {
  return (
    <Card padding="md" className={`flex min-w-0 flex-col gap-3 wrap-break-word ${className}`}>
      <h3 className="text-sm font-semibold tracking-wide text-foreground-muted uppercase">
        {title}
      </h3>
      {children}
    </Card>
  );
};

export default DetailSection;
