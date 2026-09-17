import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ReportsData = {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePool: number;
  totalCharityContributions: number;

  totalDraws: number;
  publishedDraws: number;
  draftDraws: number;
  totalEntries: number;
  totalWinners: number;

  totalPaidWinnings: number;
  pendingPayouts: number;

  charityBreakdown: Array<{
    id: string;
    name: string;
    amount: number;
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

export async function getReportsData(): Promise<ReportsData> {
  const supabase = await requireAdmin();

  const [
    usersResult,
    subscribersResult,
    drawsResult,
    entriesResult,
    winnersResult,
    contributionsResult,
    charityResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
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
        "id, status, prize_pool_amount",
      ),

    supabase
      .from("draw_entries")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("winners")
      .select("id, prize_amount, payout, verification"),

    supabase
      .from("charity_contributions")
      .select(
        "charity_id, contribution_amount",
      ),

    supabase
      .from("charities")
      .select("id, name"),
  ]);

  const draws = drawsResult.data ?? [];
  const winners = winnersResult.data ?? [];
  const contributions = contributionsResult.data ?? [];
  const charities = charityResult.data ?? [];

  const failedQueries = [
    ["users", usersResult.error],
    ["active subscribers", subscribersResult.error],
    ["draws", drawsResult.error],
    ["entries", entriesResult.error],
    ["winners", winnersResult.error],
    ["charity contributions", contributionsResult.error],
    ["charities", charityResult.error],
  ].filter(([, error]) => error);

  if (failedQueries.length > 0) {
    const details = failedQueries
      .map(([name]) => `${name}: query failed`)
      .join("; ");
    throw new Error(`Unable to load reports. ${details}`);
  }

  const totalPrizePool = draws.reduce(
    (total, draw) =>
      total + Number(draw.prize_pool_amount ?? 0),
    0,
  );

  const totalCharityContributions = contributions.reduce(
    (total, contribution) =>
      total + Number(contribution.contribution_amount ?? 0),
    0,
  );

  const totalPaidWinnings = winners
    .filter((winner) => winner.payout === "paid")
    .reduce(
      (total, winner) =>
        total + Number(winner.prize_amount ?? 0),
      0,
    );

  const pendingPayouts = winners
    .filter(
      (winner) =>
        winner.payout !== "paid" && winner.verification === "approved",
    )
    .reduce(
      (total, winner) =>
        total + Number(winner.prize_amount ?? 0),
      0,
    );

  const charityAmounts = new Map<
    string,
    number
  >();

  for (const contribution of contributions) {
    const current =
      charityAmounts.get(contribution.charity_id) ?? 0;

    charityAmounts.set(
      contribution.charity_id,
      current +
        Number(contribution.contribution_amount ?? 0),
    );
  }

  const charityBreakdown = charities
    .map((charity) => ({
      id: charity.id,
      name: charity.name,
      amount: charityAmounts.get(charity.id) ?? 0,
    }))
    .filter((charity) => charity.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    totalUsers: usersResult.count ?? 0,

    activeSubscribers:
      subscribersResult.count ?? 0,

    totalPrizePool,

    totalCharityContributions,

    totalDraws: draws.length,

    publishedDraws: draws.filter(
      (draw) => draw.status === "published",
    ).length,

    draftDraws: draws.filter(
      (draw) => draw.status === "draft",
    ).length,

    totalEntries: entriesResult.count ?? 0,

    totalWinners: winners.length,

    totalPaidWinnings,

    pendingPayouts,

    charityBreakdown,
  };
}
