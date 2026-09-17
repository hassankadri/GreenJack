import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Heart,
  MapPin,
  WalletCards,
} from "lucide-react";

import BackButton from "../../components/BackButton";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ImpactPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [preferenceResult, contributionsResult] =
    await Promise.all([
      supabase
        .from("charity_preferences")
        .select("charity_id, contribution_percent")
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase
        .from("charity_contributions")
        .select(
          "id, charity_id, subscription_amount, contribution_percent, contribution_amount, period_start, period_end, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const preference = preferenceResult.data;
  const contributions = contributionsResult.data ?? [];

  const charityIds = [
    ...new Set(
      contributions
        .map((item) => item.charity_id)
        .filter(Boolean),
    ),
  ];

  if (preference?.charity_id) {
    charityIds.push(preference.charity_id);
  }

  const uniqueCharityIds = [...new Set(charityIds)];

  const { data: charities } =
    uniqueCharityIds.length > 0
      ? await supabase
          .from("charities")
          .select("id, name, description")
          .in("id", uniqueCharityIds)
      : { data: [] };

  const charityMap = new Map(
    (charities ?? []).map((item) => [item.id, item]),
  );

  const selectedCharity = preference?.charity_id
    ? charityMap.get(preference.charity_id)
    : null;

  const totalImpact = contributions.reduce(
    (sum, item) =>
      sum + Number(item.contribution_amount ?? 0),
    0,
  );

  const totalMembershipValue = contributions.reduce(
    (sum, item) =>
      sum + Number(item.subscription_amount ?? 0),
    0,
  );

  const averageContribution =
    contributions.length > 0
      ? contributions.reduce(
          (sum, item) =>
            sum + Number(item.contribution_percent ?? 0),
          0,
        ) / contributions.length
      : Number(preference?.contribution_percent ?? 0);

  const latestContribution = contributions[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--dh-ivory)] text-[var(--dh-ink)]">
      <div className="relative">
        <div className="dh-orb dh-orb-sage absolute -left-40 top-24 h-96 w-96 opacity-45" />

        <div className="dh-orb dh-orb-orange absolute -right-40 top-[30rem] h-96 w-96 opacity-35" />

        <div className="relative mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between border-b border-black/10 pb-5">
            <BackButton fallback="/dashboard" />

            <span className="hidden text-xs uppercase tracking-[0.17em] text-zinc-400 sm:block">
              Impact ledger
            </span>
          </header>

          <section className="grid gap-10 py-14 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div className="dh-fade-up">
              <p className="dh-eyebrow text-zinc-500">
                Your impact
              </p>

              <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl lg:text-[6rem]">
                See where
                <br />
                <span className="font-[var(--font-instrument-serif)] italic">
                  your membership goes.
                </span>
              </h1>

              <p className="dh-body mt-7 max-w-2xl text-lg">
                Your membership is more than an entry into the monthly
                draw. This page keeps a record of the contribution
                attached to your membership.
              </p>
            </div>

            <div className="dh-fade-up">
              <div className="dh-panel-dark relative overflow-hidden p-8 sm:p-9">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--dh-sage)]/10 blur-3xl" />

                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dh-sage)] text-zinc-900">
                    <Heart className="h-6 w-6" />
                  </div>

                  <p className="dh-eyebrow mt-8 text-zinc-500">
                    Total recorded contribution
                  </p>

                  <p className="mt-4 text-5xl font-semibold tracking-tight">
                    {formatCurrency(totalImpact)}
                  </p>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                    Based on the contribution records associated with
                    your account.
                  </p>

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                      Supporting
                    </p>

                    <p className="mt-2 break-words text-lg font-semibold">
                      {selectedCharity?.name ?? "No cause selected"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="dh-panel p-6">
              <Heart className="h-5 w-5 text-zinc-500" />

              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-zinc-400">
                Current contribution
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {preference?.contribution_percent ?? 0}%
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Percentage attached to your current charity preference.
              </p>
            </div>

            <div className="dh-panel p-6">
              <WalletCards className="h-5 w-5 text-zinc-500" />

              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-zinc-400">
                Membership value recorded
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {formatCurrency(totalMembershipValue)}
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Subscription amounts associated with the contribution
                history shown below.
              </p>
            </div>

            <div className="dh-panel p-6">
              <Heart className="h-5 w-5 text-zinc-500" />

              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-zinc-400">
                Average contribution
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {averageContribution.toFixed(0)}%
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Average across your recorded contribution entries.
              </p>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="dh-panel p-7 sm:p-8">
              <p className="dh-eyebrow text-zinc-500">
                Current cause
              </p>

              <h2 className="mt-3 break-words text-3xl font-semibold tracking-tight">
                {selectedCharity?.name ?? "Choose a cause"}
              </h2>

              <p className="mt-4 break-words text-sm leading-7 text-zinc-500">
                {selectedCharity?.description ??
                  "Choose a charity from the directory to connect your membership to a cause."}
              </p>

              {selectedCharity && (
                <Link
                  href={`/charities/${selectedCharity.id}`}
                  className="dh-button dh-button-secondary mt-7"
                >
                  View charity
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="dh-panel p-7 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="dh-eyebrow text-zinc-500">
                    Contribution history
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Your recorded impact
                  </h2>
                </div>

                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">
                  {contributions.length} records
                </span>
              </div>

              <div className="mt-7 space-y-3">
                {contributions.length > 0 ? (
                  contributions.map((item) => {
                    const itemCharity = charityMap.get(
                      item.charity_id,
                    );

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-zinc-200 bg-[var(--dh-paper)] p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="break-words font-semibold">
                              {itemCharity?.name ?? "Selected cause"}
                            </p>

                            <p className="mt-1 text-sm text-zinc-500">
                              {formatDate(item.created_at)} ·{" "}
                              {item.contribution_percent}% contribution
                            </p>
                          </div>

                          <p className="text-2xl font-semibold">
                            {formatCurrency(
                              item.contribution_amount,
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center">
                    <Heart className="mx-auto h-8 w-8 text-zinc-400" />

                    <p className="mt-4 font-semibold">
                      No contribution records yet.
                    </p>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                      Your contribution history will appear here when
                      membership contribution records are created.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {latestContribution && (
            <section className="mt-8 rounded-[32px] bg-[var(--dh-charcoal)] p-8 text-white sm:p-10">
              <p className="dh-eyebrow text-zinc-500">
                Latest contribution
              </p>

              <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <h2 className="break-words text-4xl font-semibold tracking-tight">
                    {formatCurrency(
                      latestContribution.contribution_amount,
                    )}{" "}
                    recorded for{" "}
                    {charityMap.get(
                      latestContribution.charity_id,
                    )?.name ?? "your selected cause"}.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                    Contribution percentage:{" "}
                    {latestContribution.contribution_percent}%.
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <MapPin className="h-5 w-5 text-[var(--dh-sage)]" />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
