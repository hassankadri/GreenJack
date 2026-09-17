import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Heart,
  Settings,
  Trophy,
  Users,
  AlertCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [
    usersResult,
    charitiesResult,
    drawsResult,
    winnersResult,
    subscriptionsResult,
    latestDrawResult,
    winnersDataResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("charities")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    supabase
      .from("draws")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("winners")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "trialing"])
      .or(
        `current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`,
      ),

    supabase
      .from("draws")
      .select(
        "id, draw_month, status, mode, prize_pool_amount, winning_numbers",
      )
      .order("draw_month", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("winners")
      .select("verification, payout"),
  ]);

  const stats = [
    {
      label: "Total users",
      value: usersResult.count ?? 0,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Active subscribers",
      value: subscriptionsResult.count ?? 0,
      icon: BarChart3,
      href: "/admin/subscribers",
    },
    {
      label: "Active charities",
      value: charitiesResult.count ?? 0,
      icon: Heart,
      href: "/admin/charities/active",
    },
    {
      label: "Winner records",
      value: winnersResult.count ?? 0,
      icon: Trophy,
      href: "/admin/winners",
    },
  ];

  const pendingVerificationCount =
    winnersDataResult.data?.filter(
      (winner) => winner.verification === "pending",
    ).length ?? 0;

  const pendingPayoutCount =
    winnersDataResult.data?.filter(
      (winner) =>
        winner.verification === "approved" &&
        winner.payout === "pending",
    ).length ?? 0;

  const latestDraw = latestDrawResult.data;

  const displayName =
    profile.full_name || user.email || "Administrator";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join("")
      .toUpperCase() || "A";

  const latestDrawDate = latestDraw?.draw_month
    ? new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
      }).format(new Date(latestDraw.draw_month))
    : "No draw";

  const latestPrizePool = latestDraw
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(latestDraw.prize_pool_amount ?? 0)
    : "₹0";

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-5 sm:px-8 lg:px-10">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link
            href="/admin"
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dh-sage)] text-sm font-bold text-zinc-900">
              G
            </span>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                GreenJack
              </p>

              <p className="mt-0.5 text-xs text-zinc-500">
                Admin workspace
              </p>
            </div>
          </Link>

          {/* PROFILE MENU */}
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 transition hover:border-white/20 hover:bg-white/[0.09] [&::-webkit-details-marker]:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dh-sage)] text-sm font-bold text-zinc-900">
                {initials}
              </span>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-[180px] truncate text-sm font-semibold">
                  {displayName}
                </p>

                <p className="text-xs text-zinc-500">
                  Administrator
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-zinc-500 transition group-open:rotate-180" />
            </summary>

            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-[24px] border border-white/10 bg-[#202120] shadow-2xl">
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--dh-sage)] text-sm font-bold text-zinc-900">
                    {initials}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {displayName}
                    </p>

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <Link
                  href="/admin/users"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  User management
                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </Link>

                <Link
                  href="/admin/subscribers"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  Subscribers
                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </Link>

                <Link
                  href="/admin/draws"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  Draw manager
                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </Link>

                <Link
                  href="/admin/winners"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  Winner management
                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </Link>

                <Link
                  href="/admin/settings"
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  Platform settings
                  <ArrowUpRight className="h-4 w-4 text-zinc-600" />
                </Link>
              </div>

              <div className="border-t border-white/10 p-2">
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-2xl px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-400/10"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </div>
          </details>
        </header>

        {/* HERO */}
        <section className="py-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="dh-eyebrow text-zinc-500">
                Platform control
              </p>

              <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl">
                Run the
                <br />
                <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
                  platform.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
                Manage subscribers, charities, monthly draws and
                winner verification from one place.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-400 lg:self-end">
              <CheckCircle2 className="h-4 w-4 text-[var(--dh-sage)]" />
              Admin access
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                    <Icon className="h-5 w-5 text-[var(--dh-sage)]" />
                  </div>

                  <ArrowUpRight className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
                </div>

                <p className="mt-8 text-4xl font-semibold tracking-tight">
                  {stat.value}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  {stat.label}
                </p>
              </Link>
            );
          })}
        </section>

        {/* MAIN CONTROLS */}
        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          <Link
            href="/admin/draws"
            className="group rounded-[30px] border border-white/10 bg-[var(--dh-sage)] p-7 text-zinc-900 transition duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <Trophy className="h-6 w-6" />

            <h2 className="mt-16 text-3xl font-semibold tracking-tight">
              Manage draws
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-700">
              Configure, simulate, re-simulate and publish the monthly
              draw.
            </p>

            <div className="mt-7 flex items-center gap-2 text-sm font-semibold">
              Open draw manager
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/admin/charities"
            className="group rounded-[30px] border border-white/10 bg-white/[0.04] p-7 transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
          >
            <Heart className="h-6 w-6 text-[var(--dh-sage)]" />

            <h2 className="mt-16 text-3xl font-semibold tracking-tight">
              Charity directory
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
              Add, edit and manage the causes available to subscribers.
            </p>

            <div className="mt-7 flex items-center gap-2 text-sm font-medium text-zinc-300">
              Manage charities
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="group rounded-[30px] border border-white/10 bg-white/[0.04] p-7 transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
          >
            <Settings className="h-6 w-6 text-[var(--dh-sage)]" />

            <h2 className="mt-16 text-3xl font-semibold tracking-tight">
              Platform settings
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
              Control prize-pool settings and other platform rules.
            </p>

            <div className="mt-7 flex items-center gap-2 text-sm font-medium text-zinc-300">
              Open settings
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>
        </section>

        {/* ATTENTION */}
        <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="dh-eyebrow text-zinc-500">
                Needs attention
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Keep the platform moving.
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <AlertCircle className="h-4 w-4 text-[var(--dh-sage)]" />
              Live administrative status
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Link
              href="/admin/winners"
              className="group rounded-2xl border border-white/10 bg-black/10 p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <p className="text-3xl font-semibold">
                {pendingVerificationCount}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Pending winner verifications
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--dh-sage)]">
                Review winners
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/admin/winners"
              className="group rounded-2xl border border-white/10 bg-black/10 p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <p className="text-3xl font-semibold">
                {pendingPayoutCount}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Approved payouts pending
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--dh-sage)]">
                Manage payouts
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/admin/draws"
              className="group rounded-2xl border border-white/10 bg-black/10 p-5 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <p className="text-3xl font-semibold capitalize">
                {latestDraw?.status ?? "None"}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Latest draw status
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--dh-sage)]">
                View draw
                <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>

        {/* DRAW STATUS */}
        <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="dh-eyebrow text-zinc-500">
                Draw status
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold">
                  {latestDrawDate}
                </h2>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize text-zinc-400">
                  {latestDraw?.status ?? "No draw"}
                </span>

                {latestDraw?.mode && (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium capitalize text-zinc-400">
                    {latestDraw.mode}
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-500">
                <span>
                  {drawsResult.count ?? 0} total draw
                  {(drawsResult.count ?? 0) === 1 ? "" : "s"}
                </span>

                <span>
                  Prize pool: {latestPrizePool}
                </span>

                <span>
                  {latestDraw?.winning_numbers?.length ?? 0}/5
                  numbers generated
                </span>
              </div>
            </div>

            <Link
              href="/admin/draws"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium transition hover:border-white/20 hover:bg-white/10"
            >
              View draw activity
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
