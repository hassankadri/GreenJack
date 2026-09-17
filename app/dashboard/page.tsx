import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleUserRound,
  Heart,
  History,
  LogOut,
  Sparkles,
  Trophy,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    profileResult,
    subscriptionResult,
    scoresResult,
    charityPreferenceResult,
    drawsResult,
    winnersResult,
    drawEntriesResult,
    contributionsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle(),

    supabase
      .from("subscriptions")
      .select(
        "status, current_period_end, cancel_at_period_end, plan_id",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("golf_scores")
      .select("id, score, played_on")
      .eq("user_id", user.id)
      .order("played_on", { ascending: false })
      .limit(5),

    supabase
      .from("charity_preferences")
      .select("charity_id, contribution_percent")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("draws")
      .select(
        "id, draw_month, winning_numbers, prize_pool_amount",
      )
      .eq("status", "published")
      .order("draw_month", { ascending: false })
      .limit(3),

    supabase
      .from("winners")
      .select(
        "id, draw_id, match_count, prize_amount, verification, payout, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("draw_entries")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id),

    supabase
      .from("charity_contributions")
      .select(
        "id, charity_id, subscription_amount, contribution_percent, contribution_amount, period_start, period_end, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const profile = profileResult.data;
  const subscription = subscriptionResult.data;
  const scores = scoresResult.data ?? [];
  const charityPreference = charityPreferenceResult.data;
  const draws = drawsResult.data ?? [];
  const winners = winnersResult.data ?? [];
  const contributions = contributionsResult.data ?? [];

  let plan: {
    name: string;
    interval: string;
    price_amount: number;
  } | null = null;

  if (subscription?.plan_id) {
    const planResult = await supabase
      .from("subscription_plans")
      .select("name, interval, price_amount")
      .eq("id", subscription.plan_id)
      .maybeSingle();

    plan = planResult.data;
  }

  let charity: {
    name: string;
  } | null = null;

  if (charityPreference?.charity_id) {
    const charityResult = await supabase
      .from("charities")
      .select("name")
      .eq("id", charityPreference.charity_id)
      .maybeSingle();

    charity = charityResult.data;
  }

  const subscriptionStatusIsActive =
    subscription?.status === "active" ||
    subscription?.status === "trialing";

  const periodHasEnded =
    subscription?.current_period_end
      ? new Date(subscription.current_period_end) <= new Date()
      : false;

  const isActive =
    subscriptionStatusIsActive && !periodHasEnded;

  const totalWinnings = winners.reduce(
    (sum, winner) =>
      winner.verification === "approved" || winner.payout === "paid"
        ? sum + Number(winner.prize_amount ?? 0)
        : sum,
    0,
  );

  const totalImpact = contributions.reduce(
    (sum, contribution) =>
      sum + Number(contribution.contribution_amount ?? 0),
    0,
  );

  const drawsEntered = drawEntriesResult.count ?? 0;

  const displayName =
    profile?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const nextDrawDate = new Date();
  nextDrawDate.setDate(1);
  nextDrawDate.setMonth(nextDrawDate.getMonth() + 1);

  const nextDrawLabel = formatMonth(nextDrawDate);

  const scoreProgress = Math.min(scores.length / 5, 1);
  const hasCharity = Boolean(charityPreference?.charity_id);

  const readiness =
    (Number(isActive) +
      Number(hasCharity) +
      scoreProgress) /
    3;

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--dh-ivory)] text-[var(--dh-ink)]">
      <div className="relative">
        <div className="dh-orb dh-orb-sage absolute -left-40 top-20 h-96 w-96 opacity-55" />

        <div className="dh-orb dh-orb-orange absolute right-[-8rem] top-[34rem] h-96 w-96 opacity-45" />

        <div className="relative mx-auto max-w-[1400px] px-5 pb-12 pt-5 sm:px-8 lg:px-10">
          {/* HEADER */}
          <header className="dh-fade-up flex items-center justify-between border-b border-black/10 pb-5">
            <Link
              href="/dashboard"
              className="group flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dh-charcoal)] text-sm font-semibold text-white transition duration-300 group-hover:rotate-6 group-hover:scale-105">
                G
              </span>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                  GreenJack
                </p>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Member space
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/60 px-4 py-2.5 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:bg-white sm:flex"
              >
                <CircleUserRound className="h-4 w-4" />
                Profile
              </Link>

              <form action={logout}>
                <button
                  type="submit"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/60 transition duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-95"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </header>

          {/* HERO */}
          <section className="grid gap-10 pb-10 pt-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:pt-16">
            <div className="dh-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-2 text-xs font-medium text-zinc-600">
                <Sparkles className="h-3.5 w-3.5" />
                Member space
              </div>

              <h1 className="dh-display mt-6 max-w-4xl text-6xl sm:text-7xl lg:text-[6.5rem]">
                Play well.
                <br />
                <span className="font-[var(--font-instrument-serif)] italic">
                  Give back.
                </span>
              </h1>

              <p className="dh-body mt-7 max-w-2xl text-base sm:text-lg">
                Good to see you, {displayName}. Your scores shape your
                entry, your membership powers the draw, and your
                selected cause gets part of the impact.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/scores"
                  className="dh-button dh-button-primary group"
                >
                  Update scores
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>

                <Link
                  href="/draw"
                  className="dh-button dh-button-secondary group"
                >
                  View current draw
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>

                <Link
                  href="/impact"
                  className="dh-button dh-button-secondary group"
                >
                  My impact
                  <Heart className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                </Link>
              </div>
            </div>

            {/* IMPACT CARD */}
            <div className="dh-fade-up lg:justify-self-end">
              <div className="group relative overflow-hidden rounded-[36px] bg-[var(--dh-charcoal)] p-7 text-white shadow-[0_30px_90px_rgba(23,24,23,0.18)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(23,24,23,0.25)] sm:p-8">
                <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--dh-sage)]/10 blur-3xl transition duration-700 group-hover:scale-125" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="dh-eyebrow text-zinc-500">
                        Your impact
                      </p>

                      <p className="mt-5 text-6xl font-semibold tracking-tight">
                        {charityPreference?.contribution_percent ?? 0}%
                      </p>

                      <p className="mt-3 max-w-[250px] text-sm leading-6 text-zinc-400">
                        of your subscription goes towards your selected
                        cause.
                      </p>
                    </div>

                    <div className="dh-float flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                      <Heart className="h-5 w-5 text-[var(--dh-sage)]" />
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/10 pt-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                      Recorded impact
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {formatCurrency(totalImpact)}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {charity?.name ?? "Choose a charity"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* READINESS */}
          <section className="dh-fade-up rounded-[30px] border border-black/10 bg-white/70 p-5 backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Your monthly entry
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {readiness === 1
                    ? "You're ready to play."
                    : "Finish your setup to get ready."}
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                  Membership, five scores and a selected cause make up
                  your monthly setup.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatusItem
                  label="Membership"
                  value={isActive ? "Active" : "Inactive"}
                  active={isActive}
                />

                <StatusItem
                  label="Score card"
                  value={`${scores.length}/5 scores`}
                  active={scores.length === 5}
                />

                <StatusItem
                  label="Cause"
                  value={hasCharity ? "Selected" : "Not selected"}
                  active={hasCharity}
                />
              </div>
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-[var(--dh-sage)] transition-all duration-700"
                style={{
                  width: `${Math.round(readiness * 100)}%`,
                }}
              />
            </div>
          </section>

          {/* STATS */}
          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/subscribe"
              className="dh-fade-up group dh-panel p-6 transition duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <p className="dh-eyebrow text-zinc-500">
                  Membership
                </p>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    isActive
                      ? "bg-[var(--dh-sage-soft)] text-[#40503c]"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="mt-8 text-3xl font-semibold tracking-tight">
                {plan?.name ?? "No plan"}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                {subscription?.current_period_end
                  ? subscription.cancel_at_period_end
                    ? `Ends ${formatDate(subscription.current_period_end)}`
                    : `Renews ${formatDate(subscription.current_period_end)}`
                  : "Activate your membership"}
              </p>

              <div className="mt-5 text-sm font-medium opacity-70 transition duration-300 group-hover:opacity-100">
                Manage membership →
              </div>
            </Link>

            <Link
              href="/scores"
              className="dh-fade-up group dh-panel p-6 transition duration-300 hover:-translate-y-1"
            >
              <p className="dh-eyebrow text-zinc-500">
                Latest scores
              </p>

              <p className="mt-8 text-4xl font-semibold">
                {scores.length}
                <span className="ml-1 text-lg font-normal text-zinc-400">
                  / 5
                </span>
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Scores currently on your card
              </p>

              <div className="mt-5 text-sm font-medium opacity-70 transition duration-300 group-hover:opacity-100">
                Manage scores →
              </div>
            </Link>

            <Link
              href="/winners"
              className="dh-fade-up group dh-panel p-6 transition duration-300 hover:-translate-y-1"
            >
              <p className="dh-eyebrow text-zinc-500">
                Winnings
              </p>

              <p className="mt-8 text-3xl font-semibold">
                {formatCurrency(totalWinnings)}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                From {winners.length} winning record
                {winners.length === 1 ? "" : "s"}
              </p>

              <div className="mt-5 text-sm font-medium opacity-70 transition duration-300 group-hover:opacity-100">
                View winnings →
              </div>
            </Link>

            <Link
              href="/impact"
              className="dh-fade-up group dh-panel p-6 transition duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="dh-eyebrow text-zinc-500">
                    My impact
                  </p>

                  <p className="mt-8 text-3xl font-semibold">
                    {formatCurrency(totalImpact)}
                  </p>
                </div>

                <Heart className="h-5 w-5 text-zinc-400 transition duration-300 group-hover:scale-110 group-hover:text-zinc-900" />
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Recorded contribution history
              </p>

              <div className="mt-5 text-sm font-medium opacity-70 transition duration-300 group-hover:opacity-100">
                Explore your impact →
              </div>
            </Link>
          </section>

          {/* GAME + DRAW */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="dh-panel overflow-hidden p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="dh-eyebrow text-zinc-500">
                    Your game
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Last five rounds
                  </h2>
                </div>

                <Link
                  href="/scores"
                  className="hidden min-h-11 items-center gap-1 rounded-full py-2 text-sm font-medium underline underline-offset-4 transition hover:opacity-60 sm:flex"
                >
                  Manage scores
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-5 gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4].map((index) => {
                  const item = scores[index];

                  return (
                    <div
                      key={index}
                      style={{
                        animationDelay: `${index * 80 + 120}ms`,
                      }}
                      className={`dh-fade-up group flex min-h-[145px] flex-col justify-between rounded-2xl border p-4 transition duration-300 hover:-translate-y-1 ${
                        item
                          ? "border-zinc-200 bg-[var(--dh-paper)] hover:shadow-lg"
                          : "border-dashed border-zinc-300 bg-transparent"
                      }`}
                    >
                      <span className="text-xs font-medium text-zinc-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {item ? (
                        <>
                          <span className="text-3xl font-semibold transition-transform duration-300 group-hover:scale-105">
                            {item.score}
                          </span>

                          <span className="text-xs text-zinc-500">
                            {formatDate(item.played_on)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs leading-5 text-zinc-400">
                          No score
                          <br />
                          added
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <Link
                href="/scores"
                className="dh-button dh-button-secondary mt-6 w-full sm:hidden"
              >
                Manage scores
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="dh-panel-dark group overflow-hidden p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="dh-eyebrow text-zinc-500">
                    Draw archive
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Recent numbers
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                  <Trophy className="h-5 w-5 text-[var(--dh-sage)]" />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {draws.length > 0 ? (
                  draws.map((draw, index) => (
                    <div
                      key={draw.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:bg-white/[0.07]"
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {formatMonth(new Date(draw.draw_month))}
                        </span>

                        <span className="text-xs text-zinc-500">
                          Published
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(draw.winning_numbers ?? []).map(
                          (number: number) => (
                            <span
                              key={number}
                              className="flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-zinc-900 transition duration-200 hover:-translate-y-1 hover:scale-105"
                            >
                              {number}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-8">
                    <p className="font-medium">
                      No published draws yet.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Your draw history will appear here once results
                      are published.
                    </p>
                  </div>
                )}
              </div>

              <Link
                href="/draw/history"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full py-2 text-sm font-medium text-zinc-300 underline underline-offset-4 transition hover:text-white"
              >
                Open full draw history
                <History className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* PARTICIPATION + IMPACT */}
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Link
              href="/draw"
              className="group overflow-hidden rounded-[30px] bg-[var(--dh-sage)] p-7 text-zinc-900 transition duration-400 hover:-translate-y-1 hover:shadow-xl sm:p-8"
            >
              <div className="flex items-start justify-between">
                <CalendarDays className="h-5 w-5" />

                <ArrowUpRight className="h-5 w-5 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>

              <p className="dh-eyebrow mt-12 text-zinc-700">
                Participation
              </p>

              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                {drawsEntered} draw
                {drawsEntered === 1 ? "" : "s"} entered.
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-zinc-700">
                Your next monthly draw is expected in{" "}
                <span className="font-semibold">
                  {nextDrawLabel}.
                </span>
              </p>

              <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold">
                Enter or view the draw
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </Link>

            <Link
              href="/impact"
              className="group dh-panel p-6 transition duration-300 hover:-translate-y-1 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="dh-eyebrow text-zinc-500">
                    Your impact
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Your membership does more than enter a draw.
                  </h2>
                </div>

                <Heart className="h-5 w-5 text-zinc-400 transition duration-300 group-hover:scale-110 group-hover:text-zinc-900" />
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[var(--dh-sage-soft)] p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    Recorded contribution
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {formatCurrency(totalImpact)}
                  </p>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    Supporting
                  </p>

                  <p className="mt-3 text-lg font-semibold">
                    {charity?.name ?? "No cause selected"}
                  </p>
                </div>
              </div>

              <div className="mt-6 text-sm font-medium underline underline-offset-4 opacity-70 transition duration-300 group-hover:opacity-100">
                See contribution history →
              </div>
            </Link>
          </section>

          {/* WINNINGS */}
          <section className="dh-fade-up mt-6">
            <div className="dh-panel p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="dh-eyebrow text-zinc-500">
                    Results
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Your winnings
                  </h2>
                </div>

                <Link
                  href="/winners"
                  className="inline-flex min-h-11 items-center gap-1 rounded-full py-2 text-sm font-medium underline underline-offset-4 hover:opacity-60"
                >
                  View all
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-7 overflow-hidden rounded-2xl border border-zinc-200">
                {winners.length > 0 ? (
                  winners.map((winner) => (
                    <div
                      key={winner.id}
                      className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 last:border-b-0 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {winner.match_count}-number match
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDate(winner.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold">
                          {formatCurrency(winner.prize_amount)}
                        </span>

                        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                            {winner.payout === "paid"
                              ? "Paid"
                              : winner.verification === "rejected"
                                ? "Rejected"
                                : winner.verification === "approved"
                                  ? "Approved"
                                  : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-10">
                    <p className="font-medium">
                      No winnings yet.
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      Your winning records will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="dh-fade-up mt-6 rounded-[32px] border border-[#c9834d]/30 bg-[#ecd1ba]/50 p-7 sm:p-9">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="dh-eyebrow text-zinc-600">
                  Keep going
                </p>

                <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Your game is only one part of the story.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-600">
                  Keep your scores current, understand your draw
                  history and follow the impact of your membership.
                </p>
              </div>

              <Link
                href="/impact"
                className="dh-button dh-button-primary group"
              >
                Explore my impact
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatusItem({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--dh-paper)] px-4 py-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          active
            ? "bg-[var(--dh-sage)] text-zinc-900"
            : "bg-zinc-200 text-zinc-500"
        }`}
      >
        <Check className="h-4 w-4" />
      </div>

      <div>
        <p className="text-xs text-zinc-400">
          {label}
        </p>

        <p className="text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}
