import type { ReactNode } from 'react';

type PageContainerWidth = 'narrow' | 'wide';

const PAGE_CONTAINER_WIDTH_CLASS_NAME: Record<PageContainerWidth, string> = {
  narrow: 'max-w-md sm:max-w-xl',
  // Room for the classifier + history side panel at lg.
  wide: 'max-w-md sm:max-w-3xl lg:max-w-6xl',
};

interface PageContainerProps {
  width?: PageContainerWidth;
  children: ReactNode;
}

/** Centered `main` column used by every page. */
const PageContainer = ({ width = 'narrow', children }: PageContainerProps) => {
  return (
    <main
      className={`mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-10 sm:py-12 ${PAGE_CONTAINER_WIDTH_CLASS_NAME[width]}`}
    >
      {children}
    </main>
  );
};

export default PageContainer;
