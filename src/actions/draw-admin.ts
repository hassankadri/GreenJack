"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  generateRandomNumbers,
  generateWeightedNumbers,
} from "@/lib/draw/draw-engine";

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

  return { supabase, user };
}

function currentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}-01`;
}

export async function createCurrentDraw(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const mode = String(formData.get("mode") ?? "random");

  if (mode !== "random" && mode !== "algorithmic") {
    redirect("/admin/draws?error=Invalid+draw+mode.");
  }

  const drawMonth = currentMonth();

  const { data: existingDraw } = await supabase
    .from("draws")
    .select("id")
    .eq("draw_month", drawMonth)
    .maybeSingle();

  if (existingDraw) {
    redirect("/admin/draws?error=This+month's+draw+already+exists.");
  }

  const { count: activeSubscribers } = await supabase
    .from("subscriptions")
    .select("id", {
      count: "exact",
      head: true,
    })
    .in("status", ["active", "trialing"])
    .or(
      `current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`,
    );

  const subscriberCount = activeSubscribers ?? 0;

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("prize_pool_percent")
    .single();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(
      "plan_id, subscription_plans(price_amount, interval)",
    )
    .in("status", ["active", "trialing"])
    .or(
      `current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`,
    );

  let monthlyRevenue = 0;

  for (const subscription of subscriptions ?? []) {
    const plan = subscription.subscription_plans?.[0];

    if (!plan) {
      continue;
    }

    monthlyRevenue +=
      plan.interval === "yearly"
        ? plan.price_amount / 12
        : plan.price_amount;
  }

  const prizePoolPercent = settings?.prize_pool_percent ?? 30;

  const prizePoolAmount = Math.round(
    monthlyRevenue * (prizePoolPercent / 100),
  );

  const { data: previousDraw } = await supabase
    .from("draws")
    .select("jackpot_carried_out")
    .eq("status", "published")
    .lt("draw_month", drawMonth)
    .order("draw_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: draw, error } = await supabase
    .from("draws")
    .insert({
      draw_month: drawMonth,
      mode,
      status: "draft",
      active_subscriber_count: subscriberCount,
      prize_pool_amount: prizePoolAmount,
      jackpot_carried_in: previousDraw?.jackpot_carried_out ?? 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !draw) {
    redirect(
      `/admin/draws?error=${encodeURIComponent(
        error?.message ?? "Unable to create draw.",
      )}`,
    );
  }

  redirect("/admin/draws?success=created");
}

export async function simulateCurrentDraw() {
  const { supabase } = await requireAdmin();

  const drawMonth = currentMonth();

  const { data: draw } = await supabase
    .from("draws")
    .select("id, mode")
    .eq("draw_month", drawMonth)
    .eq("status", "draft")
    .maybeSingle();

  if (!draw) {
    redirect("/admin/draws?error=Create+the+current+draw+first.");
  }

  const { data: scores } = await supabase
    .from("golf_scores")
    .select("score")
    .order("created_at", { ascending: false })
    .limit(1000);

  const scoreNumbers = (scores ?? []).map(
    (item) => item.score,
  );

  const winningNumbers =
    draw.mode === "algorithmic"
      ? generateWeightedNumbers(scoreNumbers)
      : generateRandomNumbers();

  const { error } = await supabase
    .from("draws")
    .update({
      winning_numbers: winningNumbers,
    })
    .eq("id", draw.id);

  if (error) {
    redirect(
      `/admin/draws?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/admin/draws?success=simulated");
}

export async function voidCurrentDraw() {
  const { supabase } = await requireAdmin();

  const drawMonth = currentMonth();

  const { data: draw } = await supabase
    .from("draws")
    .select("id, status")
    .eq("draw_month", drawMonth)
    .eq("status", "published")
    .maybeSingle();

  if (!draw) {
    redirect(
      "/admin/draws?error=No+published+draw+found+for+this+month.",
    );
  }

  const { data: winners } = await supabase
    .from("winners")
    .select("verification, payout")
    .eq("draw_id", draw.id);

  const hasCompletedWinner = (winners ?? []).some(
    (winner) =>
      winner.verification === "approved" ||
      winner.payout === "paid",
  );

  if (hasCompletedWinner) {
    redirect(
      "/admin/draws?error=This+draw+cannot+be+redrawn+because+a+winner+has+already+been+approved+or+paid.",
    );
  }

  const { error: deleteError } = await supabase
    .from("winners")
    .delete()
    .eq("draw_id", draw.id);

  if (deleteError) {
    redirect(
      `/admin/draws?error=${encodeURIComponent(
        deleteError.message,
      )}`,
    );
  }

  const { error: updateError } = await supabase
    .from("draws")
    .update({
      status: "draft",
      winning_numbers: null,
      published_at: null,
    })
    .eq("id", draw.id);

  if (updateError) {
    redirect(
      `/admin/draws?error=${encodeURIComponent(
        updateError.message,
      )}`,
    );
  }

  redirect("/admin/draws?success=voided");
}

export async function publishCurrentDraw() {
  const { supabase } = await requireAdmin();

  const drawMonth = currentMonth();

  const { data: draw } = await supabase
    .from("draws")
    .select("id, winning_numbers")
    .eq("draw_month", drawMonth)
    .maybeSingle();

  if (!draw) {
    redirect("/admin/draws?error=Create+the+current+draw+first.");
  }

  if (!draw.winning_numbers || draw.winning_numbers.length !== 5) {
    redirect(
      "/admin/draws?error=Simulate+the+draw+before+publishing.",
    );
  }

  const { error: publishError } = await supabase.rpc("publish_draw", {
    p_draw_id: draw.id,
  });

  if (publishError) {
    redirect(
      `/admin/draws?error=${encodeURIComponent(
        publishError.message,
      )}`,
    );
  }

  redirect("/admin/draws?success=published");
}
