"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--dh-ivory)] px-5 text-[var(--dh-ink)]">
      <section className="dh-panel w-full max-w-lg p-8 text-center sm:p-10">
        <p className="dh-eyebrow text-zinc-500">Something went wrong</p>
        <h1 className="dh-display mt-4 text-5xl sm:text-6xl">
          We couldn&apos;t load this page.
        </h1>
        <p className="dh-body mt-5 text-zinc-600">
          Please try again. If the problem continues, come back a little later.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-[var(--dh-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-black/15 px-6 py-3 text-sm font-semibold transition hover:bg-black/5"
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
