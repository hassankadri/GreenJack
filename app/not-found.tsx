import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--dh-ivory)] px-5 text-[var(--dh-ink)]">
      <section className="dh-panel w-full max-w-lg p-8 text-center sm:p-10">
        <p className="dh-eyebrow text-zinc-500">404 · Not found</p>
        <h1 className="dh-display mt-4 text-5xl sm:text-6xl">That page has moved on.</h1>
        <p className="dh-body mt-5 text-zinc-600">The page or cause you requested is not available.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-[var(--dh-ink)] px-6 py-3 text-sm font-semibold text-white">
          Go home
        </Link>
      </section>
    </main>
  );
}
