import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

/** Single centered `main` column used by every page. */
const PageContainer = ({ children }: PageContainerProps) => {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-10 sm:max-w-xl sm:py-12">
      {children}
    </main>
  );
};

export default PageContainer;
