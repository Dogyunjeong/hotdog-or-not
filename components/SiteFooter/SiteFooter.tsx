import TextLink from '@/components/primitives/TextLink';

const SiteFooter = () => {
  return (
    <footer className="py-6 text-center text-sm text-foreground-muted">
      <TextLink variant="standalone" href="/cookie-policy">
        Cookie policy
      </TextLink>
    </footer>
  );
};

export default SiteFooter;
