import {
  BarChart3,
  Heart,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

import { getReportsData } from "@/actions/reports";
import BackButton from "../../../components/BackButton";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminReportsPage() {
  let reports: Awaited<ReturnType<typeof getReportsData>>;

  try {
    reports = await getReportsData();
  } catch (error) {
    console.error("Admin reports query failed:", error);

    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
        <section className="w-full max-w-xl rounded-[30px] border border-red-400/20 bg-red-400/10 p-8 text-center sm:p-10">
          <p className="dh-eyebrow text-red-300">Reports unavailable</p>
          <h1 className="dh-display mt-4 text-5xl sm:text-6xl">
            We couldn&apos;t load the report data.
          </h1>
          <p className="mt-5 text-sm leading-6 text-zinc-400">
            The database did not return a complete report. Refresh the page or try again later.
          </p>
          <Link href="/admin/reports" className="mt-8 inline-flex rounded-full bg-[var(--dh-sage)] px-6 py-3 text-sm font-semibold text-zinc-900">
            Try again
          </Link>
        </section>
      </main>
    );
  }

  const charityPercentage =
    reports.totalPrizePool > 0
      ? (
          (reports.totalCharityContributions /
            reports.totalPrizePool) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

        <section className="pt-10">
          <p className="dh-eyebrow text-zinc-500">
            Reports & analytics
          </p>

          <h1 className="dh-display mt-4 max-w-5xl text-6xl sm:text-7xl">
            See the whole
            <br />
            <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
              picture.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
            Platform activity, draw performance, winnings and
            charitable impact in one place.
          </p>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <Users className="h-5 w-5 text-[var(--dh-sage)]" />
            </div>

            <p className="mt-6 text-4xl font-semibold">
              {reports.totalUsers}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Total users
            </p>

            <p className="mt-4 text-xs text-zinc-600">
              {reports.activeSubscribers} active subscribers
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <Trophy className="h-5 w-5 text-[var(--dh-sage)]" />
            </div>

            <p className="mt-6 text-4xl font-semibold">
              {formatCurrency(reports.totalPrizePool)}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Total prize pool
            </p>

            <p className="mt-4 text-xs text-zinc-600">
              Across {reports.totalDraws} draws
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[var(--dh-sage)] p-6 text-zinc-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10">
              <Heart className="h-5 w-5" />
            </div>

            <p className="mt-6 text-4xl font-semibold">
              {formatCurrency(
                reports.totalCharityContributions,
              )}
            </p>

            <p className="mt-2 text-sm opacity-60">
              Charity contributions
            </p>

            <p className="mt-4 text-xs opacity-50">
              {charityPercentage}% of prize-pool value
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <BarChart3 className="h-5 w-5 text-[var(--dh-sage)]" />
            </div>

            <p className="mt-6 text-4xl font-semibold">
              {reports.totalEntries}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Draw entries
            </p>

            <p className="mt-4 text-xs text-zinc-600">
              {reports.totalWinners} winner records
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
            <p className="dh-eyebrow text-zinc-500">
              Draw activity
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Draw statistics
            </h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-5">
                <p className="text-3xl font-semibold">
                  {reports.totalDraws}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  All draws
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-5">
                <p className="text-3xl font-semibold">
                  {reports.publishedDraws}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  Published
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-5">
                <p className="text-3xl font-semibold">
                  {reports.draftDraws}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  Draft
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
            <p className="dh-eyebrow text-zinc-500">
              Winnings
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Payout overview
            </h2>

            <div className="mt-7 space-y-4">
              <div className="rounded-2xl bg-white/5 p-5">
                <p className="text-sm text-zinc-500">
                  Paid winnings
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(
                    reports.totalPaidWinnings,
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-5">
                <p className="text-sm text-zinc-500">
                  Pending payouts
                </p>

                <p className="mt-2 text-3xl font-semibold">
                  {formatCurrency(
                    reports.pendingPayouts,
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
          <div>
            <p className="dh-eyebrow text-zinc-500">
              Charitable impact
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Contribution by cause
            </h2>
          </div>

          {reports.charityBreakdown.length > 0 ? (
            <div className="mt-7 space-y-4">
              {reports.charityBreakdown.map((charity) => {
                const percentage =
                  reports.totalCharityContributions > 0
                    ? (
                        (charity.amount /
                          reports.totalCharityContributions) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <div
                    key={charity.id}
                    className="rounded-2xl bg-white/5 p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {charity.name}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {percentage}% of recorded
                          contributions
                        </p>
                      </div>

                      <p className="text-xl font-semibold">
                        {formatCurrency(charity.amount)}
                      </p>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[var(--dh-sage)]"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
              <p className="text-lg font-semibold">
                No contribution records yet.
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Charity contribution activity will appear here
                once subscription payments create records.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
