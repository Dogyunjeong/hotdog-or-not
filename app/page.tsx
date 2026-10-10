import HotdogClassificationWorkspace from '@/components/HotdogClassificationWorkspace/HotdogClassificationWorkspace';
import PageContainer from '@/components/primitives/PageContainer';

const HomePage = () => {
  return (
    <PageContainer width="wide">
      <header className="space-y-2 text-center">
        {/* Focus target after the visitor's data is erased (the privacy provider moves it here). */}
        <h1 tabIndex={-1} className="text-3xl font-bold tracking-tight outline-none">
          Hotdog or Not Hotdog
        </h1>
        <p className="text-foreground-muted">Upload a photo. We&apos;ll tell you.</p>
      </header>
      <HotdogClassificationWorkspace />
    </PageContainer>
  );
};

export default HomePage;
