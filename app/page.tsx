import HotdogClassificationWorkspace from '@/components/HotdogClassificationWorkspace/HotdogClassificationWorkspace';
import PageContainer from '@/components/primitives/PageContainer';

const HomePage = () => {
  return (
    <PageContainer>
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Hotdog or Not Hotdog</h1>
        <p className="text-foreground-muted">Upload a photo. We&apos;ll tell you.</p>
      </header>
      <HotdogClassificationWorkspace />
    </PageContainer>
  );
};

export default HomePage;
