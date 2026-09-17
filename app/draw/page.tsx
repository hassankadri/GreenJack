import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Trophy } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { enterCurrentDraw } from "@/actions/draw";
import { buildTicketFromScores } from "@/lib/draw/draw-engine";
import BackButton from "../../components/BackButton";

type DrawPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatMonth(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function DrawPage({
  searchParams,
}: DrawPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [subscriptionResult, scoresResult, drawResult, entryResult] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle(),

      supabase
        .from("golf_scores")
        .select("score, played_on")
        .eq("user_id", user.id)
        .order("played_on", { ascending: false })
        .limit(5),

      supabase
        .from("draws")
        .select("id, draw_month, status, winning_numbers")
        .eq(
          "draw_month",
          `${new Date().getFullYear()}-${String(
            new Date().getMonth() + 1,
          ).padStart(2, "0")}-01`,
        )
        .maybeSingle(),

      supabase
        .from("draw_entries")
        .select("id, ticket_numbers, draw_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const subscription = subscriptionResult.data;
  const scores = scoresResult.data ?? [];
  const draw = drawResult.data;
  const latestEntry = entryResult.data;

  if (!subscription) {
    return (
      <main className="min-h-screen bg-[var(--dh-ivory)] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <BackButton fallback="/dashboard" label="Dashboard" />

          <div className="dh-panel mt-10 p-8">
            <p className="dh-eyebrow text-zinc-500">
              Monthly draw
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Membership required.
            </h1>

            <p className="mt-3 max-w-xl text-zinc-500">
              Activate your membership before entering a draw.
            </p>

            <Link
              href="/subscribe"
              className="dh-button dh-button-primary mt-7"
            >
              View membership
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const hasEnteredCurrentDraw =
    Boolean(draw) &&
    latestEntry?.draw_id === draw?.id;

  const ticket =
    hasEnteredCurrentDraw && latestEntry
      ? latestEntry.ticket_numbers
      : scores.length === 5
        ? buildTicketFromScores(scores.map((item) => item.score))
        : [];

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--dh-ivory)] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/dashboard" label="Dashboard" />

        <section className="grid gap-10 py-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="dh-eyebrow text-zinc-500">
              Monthly draw
            </p>

            <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl">
              Your game
              <br />
              <span className="font-[var(--font-instrument-serif)] italic">
                meets chance.
              </span>
            </h1>

            <p className="dh-body mt-6 max-w-xl text-lg">
              Your latest five Stableford scores are turned into your
              five-number draw entry.
            </p>
          </div>

          <div className="dh-panel-dark p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  {draw
                    ? formatMonth(draw.draw_month)
                    : "Current draw"}
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {draw?.status === "published"
                    ? "Results"
                    : "Draw entry"}
                </h2>
              </div>

              <Trophy className="h-6 w-6 text-[var(--dh-sage)]" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {ticket.length > 0 ? (
                ticket.map((number: number, index: number) => (
                  <div
                    key={`${number}-${index}`}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-lg font-semibold text-zinc-900"
                  >
                    {number}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
                  Add five scores to create your draw entry.
                </div>
              )}
            </div>
          </div>
        </section>

        {params.error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {params.error}
          </div>
        )}

        {params.success === "entered" && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            Your entry has been added to the draw.
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="dh-panel p-7 sm:p-8">
            <p className="dh-eyebrow text-zinc-500">
              Your entry
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Five numbers. One chance.
            </h2>

            <div className="mt-8 space-y-3">
              {scores.map((score, index) => (
                <div
                  key={`${score.played_on}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-[var(--dh-paper)] px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Round {index + 1}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(score.played_on))}
                    </p>
                  </div>

                  <span className="text-2xl font-semibold">
                    {score.score}
                  </span>
                </div>
              ))}
            </div>

            {scores.length < 5 && (
              <Link
                href="/scores"
                className="dh-button dh-button-secondary mt-7"
              >
                Add more scores
              </Link>
            )}
          </div>

          <div className="rounded-[30px] border border-black/10 bg-[#ecd1ba]/50 p-7 sm:p-8">
            <p className="dh-eyebrow text-zinc-600">
              Entry status
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              {hasEnteredCurrentDraw
                ? "You're in."
                : draw?.status === "published"
                  ? "Draw published."
                  : draw
                    ? "Ready to enter."
                    : "Waiting for draw."}
            </h2>

            <p className="mt-4 text-sm leading-6 text-zinc-600">
              {hasEnteredCurrentDraw
                ? "Your entry has been recorded for the current draw."
                : draw?.status === "published"
                  ? "This draw has already been published."
                  : draw
                    ? "Your current five scores will be used for the entry."
                    : "An administrator needs to create the monthly draw before entries can be submitted."}
            </p>

            {draw?.status === "draft" &&
              !hasEnteredCurrentDraw &&
              scores.length === 5 && (
                <form action={enterCurrentDraw}>
                  <button
                    type="submit"
                    className="dh-button dh-button-primary mt-7 w-full"
                  >
                    Enter this draw
                  </button>
                </form>
              )}

            {draw?.status === "draft" &&
              !hasEnteredCurrentDraw &&
              scores.length < 5 && (
                <Link
                  href="/scores"
                  className="dh-button dh-button-primary mt-7 w-full"
                >
                  Complete your scores
                </Link>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}
