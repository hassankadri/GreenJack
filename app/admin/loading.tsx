export default function AdminLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--dh-charcoal)] px-5 text-white">
      <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--dh-sage)]" aria-label="Loading admin area" />
    </main>
  );
}
