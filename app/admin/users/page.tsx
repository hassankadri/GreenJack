import Image from "next/image";
import {
  CheckCircle2,
  UserRound,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  updateSubscriptionStatus,
  updateUserProfile,
} from "@/actions/user-admin";
import BackButton from "../../../components/BackButton";

type AdminUsersPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const subscriptionStatuses = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatStatus(value: string | null) {
  if (!value) {
    return "No subscription";
  }

  return value.replaceAll("_", " ");
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;

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

  const { data: users } = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, role, is_active, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  const userIds = (users ?? []).map((item) => item.id);

  const { data: subscriptions } =
    userIds.length > 0
      ? await supabase
          .from("subscriptions")
          .select(
            "id, user_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at, created_at",
          )
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  type SubscriptionRecord = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  created_at: string;
};

const subscriptionMap = new Map<
  string,
  SubscriptionRecord
>();

  for (const subscription of subscriptions ?? []) {
    if (!subscriptionMap.has(subscription.user_id)) {
      subscriptionMap.set(subscription.user_id, subscription);
    }
  }

  const totalUsers = users?.length ?? 0;

  const activeUsers =
    users?.filter((item) => item.is_active).length ?? 0;

  const activeSubscriptions =
    subscriptions?.filter(
      (item) =>
        (item.status === "active" || item.status === "trialing") &&
        (!item.current_period_end ||
          new Date(item.current_period_end) > new Date()),
    ).length ?? 0;

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

        <section className="pt-10">
          <p className="dh-eyebrow text-zinc-500">
            User management
          </p>

          <h1 className="dh-display mt-4 max-w-5xl text-6xl sm:text-7xl">
            Know your
            <br />
            <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
              members.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
            View member profiles, account status and subscription
            state from one place.
          </p>
        </section>

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        {params.success === "user" && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            User profile updated successfully.
          </div>
        )}

        {params.success === "subscription" && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Subscription status updated successfully.
          </div>
        )}

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <Users className="h-5 w-5 text-[var(--dh-sage)]" />
            </div>

            <p className="mt-5 text-4xl font-semibold">
              {totalUsers}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Total users
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <UserRound className="h-5 w-5 text-[var(--dh-sage)]" />
            </div>

            <p className="mt-5 text-4xl font-semibold">
              {activeUsers}
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Active accounts
            </p>
          </div>

          <div className="rounded-[26px] border border-white/10 bg-[var(--dh-sage)] p-6 text-zinc-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <p className="mt-5 text-4xl font-semibold">
              {activeSubscriptions}
            </p>

            <p className="mt-2 text-sm opacity-60">
              Active subscriptions
            </p>
          </div>
        </section>

        <section className="mt-10 space-y-5">
          {(users ?? []).map((member) => {
            const subscription = subscriptionMap.get(member.id);

            return (
              <article
                key={member.id}
                className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 sm:p-8"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-start gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10">
                      {member.avatar_url ? (
                        <Image
                            src={member.avatar_url}
                            alt=""
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-semibold">
                          {member.full_name || "Unnamed user"}
                        </h2>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-zinc-400">
                          {member.role}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            member.is_active
                              ? "bg-emerald-400/10 text-emerald-300"
                              : "bg-red-400/10 text-red-300"
                          }`}
                        >
                          {member.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-2 break-all text-xs text-zinc-500">
                        {member.id}
                      </p>

                      <p className="mt-3 text-sm text-zinc-500">
                        Joined {formatDate(member.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 px-5 py-4 xl:min-w-[240px]">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                      Subscription
                    </p>

                    <p className="mt-2 text-lg font-semibold capitalize">
                      {formatStatus(
                        subscription?.status ?? null,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Renews{" "}
                      {formatDate(
                        subscription?.current_period_end ??
                          null,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-6 border-t border-white/10 pt-7 lg:grid-cols-2">
                  <div>
                    <p className="dh-eyebrow text-zinc-500">
                      Profile
                    </p>

                    <form
                      action={updateUserProfile}
                      className="mt-5 space-y-4"
                    >
                      <input
                        type="hidden"
                        name="userId"
                        value={member.id}
                      />

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Full name
                        </label>

                        <input
                          name="fullName"
                          defaultValue={member.full_name ?? ""}
                          required
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/30"
                        />
                      </div>

                      <label className="inline-flex items-center gap-3 text-sm text-zinc-300">
                        <input
                          type="checkbox"
                          name="isActive"
                          defaultChecked={member.is_active}
                          className="h-4 w-4"
                        />
                        Account active
                      </label>

                      <div>
                        <button
                          type="submit"
                          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-900"
                        >
                          Save profile
                        </button>
                      </div>
                    </form>
                  </div>

                  <div>
                    <p className="dh-eyebrow text-zinc-500">
                      Subscription
                    </p>

                    {subscription ? (
                      <form
                        action={updateSubscriptionStatus}
                        className="mt-5 space-y-4"
                      >
                        <input
                          type="hidden"
                          name="userId"
                          value={member.id}
                        />

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Status
                          </label>

                          <select
                            name="status"
                            defaultValue={subscription.status}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm capitalize text-white outline-none focus:border-white/30"
                          >
                            {subscriptionStatuses.map(
                              (status) => (
                                <option
                                  key={status}
                                  value={status}
                                  className="bg-zinc-900"
                                >
                                  {formatStatus(status)}
                                </option>
                              ),
                            )}
                          </select>
                        </div>

                        <div className="rounded-2xl bg-white/5 p-4 text-sm text-zinc-400">
                          <p>
                            Period:
                            <span className="ml-2 text-zinc-200">
                              {formatDate(
                                subscription.current_period_start,
                              )}{" "}
                              —{" "}
                              {formatDate(
                                subscription.current_period_end,
                              )}
                            </span>
                          </p>

                          <p className="mt-2">
                            Cancel at period end:
                            <span className="ml-2 text-zinc-200">
                              {subscription.cancel_at_period_end
                                ? "Yes"
                                : "No"}
                            </span>
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="rounded-full bg-[var(--dh-sage)] px-5 py-3 text-sm font-semibold text-zinc-900"
                        >
                          Save subscription
                        </button>
                      </form>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-dashed border-white/10 px-5 py-8">
                        <p className="font-medium">
                          No subscription record
                        </p>

                        <p className="mt-2 text-sm leading-6 text-zinc-500">
                          This user has not created a subscription
                          record yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
