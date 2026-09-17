import {
  ArrowUpRight,
  Check,
  Heart,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import CharitySelector from "../../components/CharitySelector";
import BackButton from "../../components/BackButton";

type SubscribePageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    canceled?: string;
    charityId?: string;
  }>;
};

export default async function SubscribePage({
  searchParams,
}: SubscribePageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    plansResult,
    charitiesResult,
    preferenceResult,
    subscriptionResult,
  ] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select(
        "id, name, interval, price_amount, currency",
      )
      .eq("is_active", true)
      .order("price_amount"),

    supabase
      .from("charities")
      .select("id, name, description")
      .eq("is_active", true)
      .order("featured", {
        ascending: false,
      })
      .order("name"),

    supabase
      .from("charity_preferences")
      .select(
        "charity_id, contribution_percent",
      )
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("subscriptions")
      .select(
        "status, current_period_end, plan_id",
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  const plans = plansResult.data ?? [];
  const charities = charitiesResult.data ?? [];
  const preference = preferenceResult.data;
  const subscription = subscriptionResult.data;

  const selectedCharityId =
    params.charityId ??
    preference?.charity_id ??
    "";

  const selectedCharityExists = charities.some(
    (charity) =>
      charity.id === selectedCharityId,
  );

  const effectiveCharityId = selectedCharityExists
    ? selectedCharityId
    : "";

  const isActive =
    subscription?.status === "active" ||
    subscription?.status === "trialing";

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--dh-ivory)] text-[var(--dh-ink)]">
      <div className="relative">
        <div className="dh-orb dh-orb-sage absolute -left-40 top-20 h-96 w-96 opacity-45" />
        <div className="dh-orb dh-orb-orange absolute -right-40 top-[32rem] h-80 w-80 opacity-35" />

        <div className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <div className="border-b border-black/10 pb-5">
            <BackButton fallback="/dashboard" label="Back to dashboard" />
          </div>

          <section className="py-14 sm:py-16">
            <p className="dh-eyebrow text-zinc-500">
              Membership
            </p>

            <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl lg:text-[5.5rem]">
              Play your game.
              <br />
              <span className="font-[var(--font-instrument-serif)] italic">
                Create an impact.
              </span>
            </h1>

            <p className="dh-body mt-6 max-w-2xl text-lg">
              Choose your plan and decide which organisation should
              benefit from your membership.
            </p>
          </section>

          {params.error && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {params.error}
            </div>
          )}

          {params.success === "payment" && (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              <Check className="h-5 w-5" />
              Payment completed successfully.
            </div>
          )}

          {params.canceled === "true" && (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              Checkout was canceled. Your membership was not changed.
            </div>
          )}

          <section>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  01 · Your cause
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Choose where your impact goes
                </h2>

                <p className="mt-2 text-zinc-500">
                  Minimum contribution is 10% of your subscription.
                </p>
              </div>

              <Heart className="hidden h-7 w-7 text-zinc-400 sm:block" />
            </div>

            <form
              id="membership-checkout"
              action="/api/checkout"
              method="POST"
              className="mt-6"
            >
              <div className="dh-panel p-7">
                <CharitySelector
                  charities={charities}
                  initialCharityId={effectiveCharityId}
                  initialContributionPercent={
                    preference?.contribution_percent ?? 10
                  }
                />
              </div>

              <section className="mt-12">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="dh-eyebrow text-zinc-500">
                      02 · Membership
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Choose your plan
                    </h2>
                  </div>

                  {isActive && (
                    <span className="rounded-full bg-[var(--dh-sage-soft)] px-4 py-2 text-xs font-semibold text-zinc-700">
                      Membership active
                    </span>
                  )}
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="submit"
                      name="planId"
                      value={plan.id}
                      className={`dh-panel group relative block w-full p-7 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                        plan.interval === "yearly"
                          ? "ring-1 ring-[var(--dh-sage)]"
                          : ""
                      }`}
                    >
                      {plan.interval === "yearly" && (
                        <span className="absolute right-6 top-6 rounded-full bg-[var(--dh-sage-soft)] px-3 py-1 text-xs font-semibold text-zinc-700">
                          Best value
                        </span>
                      )}

                      <p className="dh-eyebrow text-zinc-500">
                        {plan.interval === "yearly"
                          ? "Yearly"
                          : "Monthly"}
                      </p>

                      <h3 className="mt-3 text-3xl font-semibold">
                        {plan.name}
                      </h3>

                      <div className="mt-8 flex items-end gap-2">
                        <span className="text-5xl font-semibold tracking-tight">
                          ₹
                          {Number(
                            plan.price_amount,
                          ).toLocaleString("en-IN")}
                        </span>

                        <span className="mb-2 text-sm text-zinc-500">
                          /
                          {plan.interval === "yearly"
                            ? "year"
                            : "month"}
                        </span>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-zinc-500">
                        Membership access, monthly draw participation
                        and charitable impact.
                      </p>

                      <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-5">
                        <span className="text-sm font-semibold">
                          {isActive
                            ? "Switch to this plan"
                            : "Continue to secure checkout"}
                        </span>

                        <ArrowUpRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </div>
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  You will be redirected to Stripe&apos;s secure
                  checkout.
                </p>
              </section>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
