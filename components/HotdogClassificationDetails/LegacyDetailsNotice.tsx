/** Results saved before v0.3 have no details. */
const LegacyDetailsNotice = () => {
  return (
    <p className="text-sm text-foreground-muted">
      This check is from before we got fancy, so there&apos;s just the verdict.
    </p>
  );
};

export default LegacyDetailsNotice;
