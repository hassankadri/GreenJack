import Link from "next/link";
import BackButton from "../../components/BackButton";
import { ArrowUpRight, Heart, Search } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type CharitiesPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function CharitiesPage({
  searchParams,
}: CharitiesPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const supabase = await createClient();

  let charitiesQuery = supabase
    .from("charities")
    .select(
      "id, name, description, featured, is_active",
    )
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("name");

  if (query) {
    const escapedQuery = query
      .replaceAll("\\", "\\\\")
      .replaceAll('"', '\\"');

    charitiesQuery = charitiesQuery.or(
      `name.ilike."*${escapedQuery}*",description.ilike."*${escapedQuery}*"`,
    );
  }

  const { data: charities, error } = await charitiesQuery;

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--dh-ivory)] text-[var(--dh-ink)]">
      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="dh-orb dh-orb-sage absolute -left-32 top-10 h-80 w-80 opacity-40" />

        <div className="dh-orb dh-orb-orange absolute -right-20 top-[30rem] h-72 w-72 opacity-40" />

        <div className="relative">
          <BackButton fallback="/" />

          <section className="pt-12 sm:pt-16">
            <p className="dh-eyebrow text-zinc-500">
              The causes
            </p>

            <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end">
              <div>
                <h1 className="dh-display max-w-4xl text-6xl sm:text-7xl lg:text-[6.5rem]">
                  Choose a cause
                  <br />
                  <span className="font-[var(--font-instrument-serif)] italic">
                    worth playing for.
                  </span>
                </h1>

                <p className="dh-body mt-6 max-w-2xl text-lg">
                  Explore the organisations supported through the
                  GreenJack community.
                </p>
              </div>

              <div className="dh-panel p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--dh-sage-soft)]">
                  <Heart className="h-5 w-5" />
                </div>

                <p className="mt-5 text-3xl font-semibold tracking-tight">
                  Give back from every membership.
                </p>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Members can direct at least 10% of their
                  subscription towards a cause they choose.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-12">
            <form
              method="get"
              className="dh-panel flex flex-col gap-4 p-4 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search charities..."
                  className="w-full rounded-full border border-zinc-200 bg-white px-11 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
                />
              </div>

              <button
                type="submit"
                className="dh-button dh-button-primary"
              >
                Search
              </button>

              {query && (
                <Link
                  href="/charities"
                  className="dh-button dh-button-secondary"
                >
                  Clear
                </Link>
              )}
            </form>
          </section>

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              Unable to load charities right now.
            </div>
          )}

          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Directory
                </p>

                <h2 className="mt-2 break-words text-3xl font-semibold tracking-tight">
                  {query
                    ? `Results for "${query}"`
                    : "Explore the directory"}
                </h2>
              </div>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500">
                {charities?.length ?? 0} causes
              </span>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {charities && charities.length > 0 ? (
                charities.map((charity, index) => (
                  <Link
                    href={`/charities/${charity.id}`}
                    key={charity.id}
                    className={`group relative overflow-hidden rounded-[30px] border border-black/10 p-7 transition duration-200 hover:-translate-y-1 hover:shadow-xl ${
                      index % 3 === 0
                        ? "bg-[var(--dh-sage)] text-zinc-900"
                        : index % 3 === 1
                          ? "bg-[var(--dh-charcoal)] text-white"
                          : "bg-[var(--dh-paper)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full ${
                          index % 3 === 1
                            ? "bg-white/10"
                            : "bg-black/5"
                        }`}
                      >
                        <Heart className="h-5 w-5" />
                      </span>

                      <ArrowUpRight
                        className={`h-5 w-5 transition duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 ${
                          index % 3 === 1
                            ? "text-zinc-500"
                            : "text-zinc-400"
                        }`}
                      />
                    </div>

                    {charity.featured && (
                      <span
                        className={`mt-7 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                          index % 3 === 1
                            ? "bg-white/10 text-zinc-300"
                            : "bg-black/5 text-zinc-600"
                        }`}
                      >
                        Featured
                      </span>
                    )}

                    <h3 className="mt-8 break-words text-2xl font-semibold tracking-tight">
                      {charity.name}
                    </h3>

                    <p
                      className={`mt-3 break-words text-sm leading-6 ${
                        index % 3 === 1
                          ? "text-zinc-400"
                          : "text-zinc-600"
                      }`}
                    >
                      {charity.description}
                    </p>

                    <div
                      className={`mt-8 border-t pt-5 text-sm font-medium ${
                        index % 3 === 1
                          ? "border-white/10 text-zinc-300"
                          : "border-black/10 text-zinc-800"
                      }`}
                    >
                      View cause
                    </div>
                  </Link>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-3">
                  <div className="dh-panel px-6 py-14 text-center">
                    <p className="text-lg font-semibold">
                      No charities found.
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Try a different search term.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="mt-10 rounded-[32px] bg-[var(--dh-charcoal)] p-8 text-white sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Make it personal
                </p>

                <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  The game is yours.
                  <br />
                  So is the impact.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
                  Choose the cause that matters to you when you
                  set your membership preference.
                </p>
              </div>

              <Link
                href="/subscribe"
                className="dh-button w-full bg-[var(--dh-sage)] text-zinc-900 sm:w-auto"
              >
                Choose my cause
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
