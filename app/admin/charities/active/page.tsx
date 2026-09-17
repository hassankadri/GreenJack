import Link from "next/link";
import { ArrowUpRight, Heart, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import BackButton from "../../../../components/BackButton";

export default async function ActiveCharitiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: charities } = await supabase
    .from("charities")
    .select("id, name, description, featured")
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("name");

  const charityIds = (charities ?? []).map((charity) => charity.id);

  const { data: preferences } =
    charityIds.length > 0
      ? await supabase
          .from("charity_preferences")
          .select("user_id, charity_id, contribution_percent")
          .in("charity_id", charityIds)
      : { data: [] };

  const supportersMap = new Map<string, Set<string>>();
  const contributionMap = new Map<string, number>();

  for (const preference of preferences ?? []) {
    if (!supportersMap.has(preference.charity_id)) {
      supportersMap.set(preference.charity_id, new Set());
    }

    supportersMap
      .get(preference.charity_id)!
      .add(preference.user_id);

    const currentTotal =
      contributionMap.get(preference.charity_id) ?? 0;

    contributionMap.set(
      preference.charity_id,
      currentTotal + Number(preference.contribution_percent ?? 0),
    );
  }

  const totalSupporters = new Set(
    (preferences ?? []).map((item) => item.user_id),
  ).size;

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

        <section className="pt-10">
          <p className="dh-eyebrow text-zinc-500">
            Charity overview
          </p>

          <h1 className="dh-display mt-4 text-6xl sm:text-7xl">
            See where the
            <br />
            <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
              impact goes.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
            See the active causes on the platform and how many
            members currently support each one.
          </p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <Heart className="h-5 w-5 text-[var(--dh-sage)]" />

            <p className="mt-7 text-4xl font-semibold">
              {charities?.length ?? 0}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Active charities
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <Users className="h-5 w-5 text-[var(--dh-sage)]" />

            <p className="mt-7 text-4xl font-semibold">
              {totalSupporters}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Members supporting a cause
            </p>
          </div>

          <Link
            href="/admin/charities"
            className="group rounded-[28px] border border-white/10 bg-[var(--dh-sage)] p-6 text-zinc-900 transition hover:-translate-y-1"
          >
            <ArrowUpRight className="h-5 w-5" />

            <p className="mt-7 text-xl font-semibold">
              Manage charities
            </p>

            <p className="mt-2 text-sm text-zinc-700">
              Create, edit and manage the directory.
            </p>
          </Link>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="dh-eyebrow text-zinc-500">
                Active directory
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                Current causes
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(charities ?? []).map((charity) => {
              const supporters =
                supportersMap.get(charity.id)?.size ?? 0;

              const totalContribution =
                contributionMap.get(charity.id) ?? 0;

              const averageContribution =
                supporters > 0
                  ? Math.round(
                      totalContribution / supporters,
                    )
                  : 0;

              return (
                <div
                  key={charity.id}
                  className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="break-words text-xl font-semibold">
                          {charity.name}
                        </h3>

                        {charity.featured && (
                          <span className="rounded-full bg-[var(--dh-sage)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-900">
                            Featured
                          </span>
                        )}
                      </div>

                      <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-zinc-500">
                        {charity.description}
                      </p>
                    </div>

                    <Heart className="h-5 w-5 shrink-0 text-[var(--dh-sage)]" />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                        Supporters
                      </p>

                      <p className="mt-2 text-2xl font-semibold">
                        {supporters}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                        Avg. contribution
                      </p>

                      <p className="mt-2 text-2xl font-semibold">
                        {averageContribution}%
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/charities/${charity.id}`}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full py-2 text-sm font-medium text-[var(--dh-sage)]"
                  >
                    View charity
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>

          {(!charities || charities.length === 0) && (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-14 text-center text-zinc-500">
              No active charities found.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
