import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Trophy,
} from "lucide-react";
import { redirect } from "next/navigation";

import BackButton from "../../../components/BackButton";
import { createClient } from "@/lib/supabase/server";

function formatMonth(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

export default async function DrawHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [drawsResult, entriesResult, winnersResult] =
    await Promise.all([
      supabase
        .from("draws")
        .select(
          `
            id,
            draw_month,
            status,
            winning_numbers,
            active_subscriber_count,
            prize_pool_amount,
            jackpot_carried_in,
            jackpot_carried_out
          `,
        )
        .eq("status", "published")
        .order("draw_month", {
          ascending: false,
        }),

      supabase
        .from("draw_entries")
        .select(
          "id, draw_id, ticket_numbers, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("winners")
        .select(
          "id, draw_id, match_count, prize_amount, verification, payout",
        )
        .eq("user_id", user.id),
    ]);

  const draws = drawsResult.data ?? [];
  const entries = entriesResult.data ?? [];
  const winners = winnersResult.data ?? [];

  const entryMap = new Map(
    entries.map((entry) => [
      entry.draw_id,
      entry,
    ]),
  );

  const winnerMap = new Map(
    winners.map((winner) => [
      winner.draw_id,
      winner,
    ]),
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--dh-ivory)] text-[var(--dh-ink)]">
      <div className="relative">
        <div className="dh-orb dh-orb-sage absolute -left-40 top-16 h-96 w-96 opacity-40" />

        <div className="dh-orb dh-orb-orange absolute -right-40 top-[34rem] h-80 w-80 opacity-30" />

        <div className="relative mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-10">
          {/* HEADER */}
          <header className="flex items-center justify-between border-b border-black/10 pb-5">
            <BackButton fallback="/draw" />

            <div className="hidden items-center gap-2 text-xs uppercase tracking-[0.17em] text-zinc-400 sm:flex">
              <Trophy className="h-3.5 w-3.5" />
              Draw archive
            </div>
          </header>

          {/* HERO */}
          <section className="py-14 sm:py-16">
            <p className="dh-eyebrow text-zinc-500">
              Your draw history
            </p>

            <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl lg:text-[5.8rem]">
              Every draw.
              <br />
              <span className="font-[var(--font-instrument-serif)] italic">
                Every chance.
              </span>
            </h1>

            <p className="dh-body mt-6 max-w-2xl text-lg">
              Review published draws, your entries, winning numbers,
              prize pools and any winnings connected to your account.
            </p>
          </section>

          {/* SUMMARY */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="dh-panel p-6">
              <p className="dh-eyebrow text-zinc-500">
                Draws entered
              </p>

              <p className="mt-5 text-4xl font-semibold">
                {entries.length}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Total entries recorded for your account
              </p>
            </div>

            <div className="dh-panel p-6">
              <p className="dh-eyebrow text-zinc-500">
                Published draws
              </p>

              <p className="mt-5 text-4xl font-semibold">
                {draws.length}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Completed monthly draws
              </p>
            </div>

            <div className="dh-panel p-6">
              <p className="dh-eyebrow text-zinc-500">
                Winning records
              </p>

              <p className="mt-5 text-4xl font-semibold">
                {winners.length}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Winning results linked to your account
              </p>
            </div>
          </section>

          {/* HISTORY */}
          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Archive
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Published draws
                </h2>
              </div>

              <Link
                href="/draw"
                className="hidden min-h-11 items-center gap-1 rounded-full py-2 text-sm font-medium underline underline-offset-4 transition hover:opacity-60 sm:flex"
              >
                Current draw
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 space-y-5">
              {draws.length > 0 ? (
                draws.map((draw) => {
                  const entry = entryMap.get(draw.id);
                  const winner = winnerMap.get(draw.id);

                  return (
                    <article
                      key={draw.id}
                      className="dh-panel overflow-hidden"
                    >
                      <div className="p-6 sm:p-8">
                        {/* TOP */}
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--dh-sage-soft)]">
                                <CalendarDays className="h-5 w-5" />
                              </div>

                              <div>
                                <p className="dh-eyebrow text-zinc-500">
                                  Monthly draw
                                </p>

                                <h3 className="mt-1 text-2xl font-semibold">
                                  {formatMonth(
                                    draw.draw_month,
                                  )}
                                </h3>
                              </div>
                            </div>
                          </div>

                          {winner ? (
                            <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Winner
                            </span>
                          ) : entry ? (
                            <span className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--dh-sage-soft)] px-3 py-1.5 text-xs font-semibold text-zinc-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Entered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 self-start rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              No entry
                            </span>
                          )}
                        </div>

                        {/* NUMBERS */}
                        <div className="mt-8 grid gap-6 lg:grid-cols-2">
                          <div className="rounded-2xl bg-[var(--dh-charcoal)] p-6 text-white">
                            <p className="dh-eyebrow text-zinc-500">
                              Winning numbers
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2">
                              {(draw.winning_numbers ?? []).map(
                                (
                                  number: number,
                                  index: number,
                                ) => (
                                  <span
                                    key={`${draw.id}-${number}-${index}`}
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-zinc-900"
                                  >
                                    {number}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-black/10 bg-[var(--dh-paper)] p-6">
                            <p className="dh-eyebrow text-zinc-500">
                              Your entry
                            </p>

                            {entry ? (
                              <>
                                <div className="mt-5 flex flex-wrap gap-2">
                                  {entry.ticket_numbers.map(
                                    (
                                      number: number,
                                      index: number,
                                    ) => (
                                      <span
                                        key={`${entry.id}-${number}-${index}`}
                                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--dh-sage-soft)] text-sm font-semibold"
                                      >
                                        {number}
                                      </span>
                                    ),
                                  )}
                                </div>

                                <p className="mt-4 text-xs text-zinc-500">
                                  Entered on{" "}
                                  {formatDate(
                                    entry.created_at,
                                  )}
                                </p>
                              </>
                            ) : (
                              <p className="mt-5 text-sm leading-6 text-zinc-500">
                                You did not enter this draw.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* DRAW STATS */}
                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-black/10 bg-[var(--dh-paper)] p-4">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                              Prize pool
                            </p>

                            <p className="mt-2 font-semibold">
                              {formatCurrency(
                                draw.prize_pool_amount,
                              )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-black/10 bg-[var(--dh-paper)] p-4">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                              Subscribers
                            </p>

                            <p className="mt-2 font-semibold">
                              {draw.active_subscriber_count}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-black/10 bg-[var(--dh-paper)] p-4">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                              Jackpot rollover
                            </p>

                            <p className="mt-2 font-semibold">
                              {formatCurrency(
                                draw.jackpot_carried_in,
                              )}
                            </p>
                          </div>
                        </div>

                        {/* WINNER */}
                        {winner && (
                          <div className="mt-6 rounded-2xl bg-[var(--dh-sage-soft)] p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <Trophy className="h-5 w-5" />

                                <div>
                                  <p className="text-sm font-semibold">
                                    {winner.match_count}-number match
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-600">
                                    Verification:{" "}
                                    <span className="capitalize">
                                      {winner.verification}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div className="text-left sm:text-right">
                                <p className="text-xl font-semibold">
                                  {formatCurrency(
                                    winner.prize_amount,
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-zinc-600">
                                  {winner.payout === "paid"
                                    ? "Payout completed"
                                    : "Payout pending"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="dh-panel px-6 py-14 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-zinc-400" />

                  <h3 className="mt-5 text-2xl font-semibold">
                    No published draws yet.
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                    Your completed draw history will appear here once
                    results are published.
                  </p>

                  <Link
                    href="/draw"
                    className="dh-button dh-button-primary mt-7"
                  >
                    View current draw
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
