export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--dh-ivory)] px-5 text-[var(--dh-ink)]">
      <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--dh-sage)]" aria-label="Loading" />
    </main>
  );
}
