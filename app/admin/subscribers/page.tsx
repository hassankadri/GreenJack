import { CreditCard, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import BackButton from "../../../components/BackButton";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminSubscribersPage() {
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

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at",
    )
    .in("status", ["active", "trialing"])
    .or(
      `current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`,
    )
    .order("created_at", { ascending: false });

  const userIds = [
    ...new Set((subscriptions ?? []).map((item) => item.user_id)),
  ];

  const { data: users } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("id", userIds)
      : { data: [] };

  const userMap = new Map(
    (users ?? []).map((item) => [item.id, item]),
  );

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

        <section className="pt-10">
          <p className="dh-eyebrow text-zinc-500">
            Subscription management
          </p>

          <h1 className="dh-display mt-4 text-6xl sm:text-7xl">
            Know your
            <br />
            <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
              subscribers.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
            View members with an active or trialing subscription.
          </p>
        </section>

        <section className="mt-10 rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <p className="dh-eyebrow text-zinc-500">
                Active subscribers
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                {subscriptions?.length ?? 0}
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <CreditCard className="h-5 w-5 text-[var(--dh-sage)]" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {(subscriptions ?? []).map((subscription) => {
              const member = userMap.get(subscription.user_id);

              return (
                <div
                  key={subscription.id}
                  className="rounded-2xl border border-white/10 bg-black/10 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <UserRound className="h-5 w-5 text-zinc-400" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold">
                          {member?.full_name || "Unnamed user"}
                        </p>

                        <p className="mt-1 break-all text-xs text-zinc-500">
                          {subscription.user_id}
                        </p>
                      </div>
                    </div>

                    <div className="grid min-w-0 gap-4 sm:grid-cols-3 lg:min-w-[520px]">
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                          Status
                        </p>

                        <p className="mt-1 capitalize text-sm font-medium text-emerald-300">
                          {subscription.status}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                          Renewal
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {formatDate(
                            subscription.current_period_end,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                          Cancellation
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {subscription.cancel_at_period_end
                            ? "At period end"
                            : "Not scheduled"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {(!subscriptions || subscriptions.length === 0) && (
              <div className="rounded-2xl border border-white/10 bg-black/10 px-6 py-12 text-center text-zinc-500">
                No active subscribers found.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
