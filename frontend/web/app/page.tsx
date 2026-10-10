import HotdogClassifier from '@/components/HotdogClassifier/HotdogClassifier';

const HomePage = () => {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Hotdog or Not Hotdog</h1>
        <p className="text-zinc-600 dark:text-zinc-400">Upload a photo. We&apos;ll tell you.</p>
      </header>
      <HotdogClassifier />
    </main>
  );
};

export default HomePage;
