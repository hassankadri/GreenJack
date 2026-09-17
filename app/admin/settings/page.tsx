import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Dice5,
  BarChart3,
  Heart,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import BackButton from "../../../components/BackButton";

type SettingsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

async function requireAdmin() {
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

  return supabase;
}

async function updatePrizePool(formData: FormData) {
  "use server";

  const supabase = await requireAdmin();

  const rawValue = String(
    formData.get("prize_pool_percent") ?? "",
  ).trim();

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value <= 0 || value > 100) {
    redirect(
      "/admin/settings?error=Prize+pool+percentage+must+be+between+1+and+100.",
    );
  }

  const { data: settings, error: settingsError } = await supabase
    .from("platform_settings")
    .select("id")
    .single();

  if (settingsError || !settings) {
    redirect(
      "/admin/settings?error=Platform+settings+record+not+found.",
    );
  }

  const { error: updateError } = await supabase
    .from("platform_settings")
    .update({
      prize_pool_percent: value,
    })
    .eq("id", settings.id);

  if (updateError) {
    redirect(
      `/admin/settings?error=${encodeURIComponent(
        updateError.message,
      )}`,
    );
  }

  redirect(
    "/admin/settings?success=Prize+pool+percentage+updated.",
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}


export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = await searchParams;
  const supabase = await requireAdmin();

  const [
    { data: settings, error: settingsError },
    { data: plans },
    { count: activeSubscribers },
    { count: activeCharities },
  ] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("prize_pool_percent")
      .single(),

    supabase
      .from("subscription_plans")
      .select(
        "id, name, interval, price_amount, currency, is_active",
      )
      .eq("is_active", true)
      .order("price_amount", { ascending: true }),

    supabase
      .from("subscriptions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", ["active", "trialing"])
      .or(
        `current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`,
      ),

    supabase
      .from("charities")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_active", true),
  ]);

  if (settingsError || !settings) {
    return (
      <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

          <div className="mt-10 rounded-[30px] border border-red-400/20 bg-red-400/10 p-8 text-red-300">
            Unable to load platform settings.
          </div>
        </div>
      </main>
    );
  }

  const prizePoolPercent = settings.prize_pool_percent ?? 30;

  const monthlyPlan = plans?.find(
    (plan) => plan.interval === "monthly",
  );

  const yearlyPlan = plans?.find(
    (plan) => plan.interval === "yearly",
  );

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

        <section className="pt-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="dh-eyebrow text-zinc-500">
                Platform settings
              </p>

              <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl">
                Control the
                <br />
                <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
                  system.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
                Change the platform settings that actually affect
                draws, prizes and membership operations.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-4 py-2.5 text-sm text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Protected admin area
            </div>
          </div>
        </section>

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {params.success}
          </div>
        )}

        {/* QUICK OVERVIEW */}

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/subscribers"
            className="group rounded-[26px] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:bg-white/[0.07]"
          >
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-[var(--dh-sage)]" />
              <ArrowUpRight className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
            </div>

            <p className="mt-6 text-3xl font-semibold">
              {activeSubscribers ?? 0}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Active subscribers
            </p>
          </Link>

          <Link
            href="/admin/charities/active"
            className="group rounded-[26px] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:bg-white/[0.07]"
          >
            <div className="flex items-center justify-between">
              <Heart className="h-5 w-5 text-[var(--dh-sage)]" />
              <ArrowUpRight className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
            </div>

            <p className="mt-6 text-3xl font-semibold">
              {activeCharities ?? 0}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Active charities
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="group rounded-[26px] border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-1 hover:bg-white/[0.07]"
          >
            <div className="flex items-center justify-between">
              <BarChart3 className="h-5 w-5 text-[var(--dh-sage)]" />
              <ArrowUpRight className="h-4 w-4 text-zinc-600 transition group-hover:text-white" />
            </div>

            <p className="mt-6 text-3xl font-semibold">
              Reports
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Platform analytics
            </p>
          </Link>
        </section>

        {/* PRIMARY SETTINGS */}

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[30px] border border-white/10 bg-[var(--dh-sage)] p-7 text-zinc-900 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/10">
                  <CircleDollarSign className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
                    Live setting
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    Prize pool
                  </h2>
                </div>
              </div>

              <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold">
                Editable
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-700">
                  Revenue allocation
                </p>

                <p className="mt-2 text-6xl font-semibold tracking-tight">
                  {prizePoolPercent}%
                </p>

                <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-700">
                  Portion of active subscription revenue allocated to
                  the monthly prize pool.
                </p>
              </div>

              <form
                action={updatePrizePool}
                className="flex items-center gap-2"
              >
                <div className="flex items-center rounded-full border border-black/10 bg-white/30 px-4 py-3">
                  <input
                    name="prize_pool_percent"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    defaultValue={prizePoolPercent}
                    aria-label="Prize pool percentage"
                    className="w-16 bg-transparent text-center text-lg font-semibold outline-none"
                  />

                  <span className="text-sm font-semibold">
                    %
                  </span>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </form>
            </div>
          </div>

          <Link
            href="/admin/draws"
            className="group rounded-[30px] border border-white/10 bg-white/[0.04] p-7 transition hover:-translate-y-1 hover:bg-white/[0.07] sm:p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                <Dice5 className="h-5 w-5 text-[var(--dh-sage)]" />
              </div>

              <ArrowUpRight className="h-5 w-5 text-zinc-600 transition group-hover:text-white" />
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Draw engine
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              Monthly draw controls
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Create, simulate, re-simulate and publish the monthly
              draw.
            </p>

            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[var(--dh-sage)]">
              Open draw manager
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        </section>

        {/* WINNER + MEMBERSHIP */}

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                  <Trophy className="h-5 w-5 text-[var(--dh-sage)]" />
                </div>

                <div>
                  <p className="dh-eyebrow text-zinc-500">
                    Winner rules
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    Prize distribution
                  </h2>
                </div>
              </div>

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-500">
                Fixed
              </span>
            </div>

            <div className="mt-7 space-y-2">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="text-sm text-zinc-300">
                  5-number match
                </span>

                <span className="font-semibold text-[var(--dh-sage)]">
                  40%
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="text-sm text-zinc-300">
                  4-number match
                </span>

                <span className="font-semibold text-[var(--dh-sage)]">
                  35%
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span className="text-sm text-zinc-300">
                  3-number match
                </span>

                <span className="font-semibold text-[var(--dh-sage)]">
                  25%
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
              <Check className="h-4 w-4 text-[var(--dh-sage)]" />
              Jackpot rolls over when unclaimed.
            </div>

            <Link
              href="/admin/winners"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full py-2 text-sm font-medium text-[var(--dh-sage)]"
            >
              Manage winners
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                <CreditCard className="h-5 w-5 text-[var(--dh-sage)]" />
              </div>

              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Membership
                </p>

                <h2 className="mt-1 text-2xl font-semibold">
                  Active plans
                </h2>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              {monthlyPlan && (
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Monthly
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Active subscription plan
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatCurrency(monthlyPlan.price_amount)}
                    </p>
                  </div>
                </div>
              )}

              {yearlyPlan && (
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Yearly
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Active subscription plan
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatCurrency(yearlyPlan.price_amount)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/admin/subscribers"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full py-2 text-sm font-medium text-[var(--dh-sage)]"
            >
              View subscribers
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* OPERATIONS */}

        <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <SlidersHorizontal className="h-5 w-5 text-[var(--dh-sage)]" />
            </div>

            <div>
              <p className="dh-eyebrow text-zinc-500">
                Administration
              </p>

              <h2 className="mt-1 text-2xl font-semibold">
                Platform operations
              </h2>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/users"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
            >
              <Users className="h-5 w-5 text-[var(--dh-sage)]" />

              <p className="mt-4 font-medium">
                Users
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Accounts and profiles
              </p>

              <ChevronRight className="mt-5 h-4 w-4 text-zinc-600 transition group-hover:text-white" />
            </Link>

            <Link
              href="/admin/charities"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
            >
              <Heart className="h-5 w-5 text-[var(--dh-sage)]" />

              <p className="mt-4 font-medium">
                Charities
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Directory and causes
              </p>

              <ChevronRight className="mt-5 h-4 w-4 text-zinc-600 transition group-hover:text-white" />
            </Link>

            <Link
              href="/admin/winners"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
            >
              <Trophy className="h-5 w-5 text-[var(--dh-sage)]" />

              <p className="mt-4 font-medium">
                Winners
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Verification and payouts
              </p>

              <ChevronRight className="mt-5 h-4 w-4 text-zinc-600 transition group-hover:text-white" />
            </Link>

            <Link
              href="/admin/reports"
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
            >
              <BarChart3 className="h-5 w-5 text-[var(--dh-sage)]" />

              <p className="mt-4 font-medium">
                Reports
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Platform analytics
              </p>

              <ChevronRight className="mt-5 h-4 w-4 text-zinc-600 transition group-hover:text-white" />
            </Link>
          </div>
        </section>

        <p className="mt-6 text-xs text-zinc-600">
          Changes to platform settings affect future draw calculations.
        </p>
      </div>
    </main>
  );
}
