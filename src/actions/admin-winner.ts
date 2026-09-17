"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

function getWinnerId(formData: FormData) {
  return String(formData.get("winnerId") ?? "").trim();
}

export async function approveWinner(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const winnerId = getWinnerId(formData);

  if (!winnerId) {
    redirect("/admin/winners?error=Invalid+winner.");
  }

  const { data: winner } = await supabase
    .from("winners")
    .select("id, verification, proof_path")
    .eq("id", winnerId)
    .maybeSingle();

  if (!winner) {
    redirect("/admin/winners?error=Winner+not+found.");
  }

  if (winner.verification !== "pending" || !winner.proof_path) {
    redirect("/admin/winners?error=Winner+must+have+pending+verification+and+proof+before+approval.");
  }

  const { data: updatedWinner, error } = await supabase
    .from("winners")
    .update({
      verification: "approved",
      payout: "pending",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", winner.id)
    .eq("verification", "pending")
    .select("id")
    .maybeSingle();

  if (error || !updatedWinner) {
    redirect(
      `/admin/winners?error=${encodeURIComponent(error?.message ?? "Winner state changed. Please refresh and try again.")}`,
    );
  }

  redirect("/admin/winners?success=approved");
}

export async function rejectWinner(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const winnerId = getWinnerId(formData);

  if (!winnerId) {
    redirect("/admin/winners?error=Invalid+winner.");
  }

  const { data: winner } = await supabase
    .from("winners")
    .select("id, verification")
    .eq("id", winnerId)
    .maybeSingle();

  if (!winner) {
    redirect("/admin/winners?error=Winner+not+found.");
  }

  if (winner.verification !== "pending") {
    redirect("/admin/winners?error=Only+pending+winners+can+be+rejected.");
  }

  const { data: updatedWinner, error } = await supabase
    .from("winners")
    .update({
      verification: "rejected",
      payout: "pending",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", winner.id)
    .eq("verification", "pending")
    .select("id")
    .maybeSingle();

  if (error || !updatedWinner) {
    redirect(
      `/admin/winners?error=${encodeURIComponent(error?.message ?? "Winner state changed. Please refresh and try again.")}`,
    );
  }

  redirect("/admin/winners?success=rejected");
}

export async function markWinnerPaid(formData: FormData) {
  const { supabase } = await requireAdmin();
  const winnerId = getWinnerId(formData);

  if (!winnerId) {
    redirect("/admin/winners?error=Invalid+winner.");
  }

  const { data: winner } = await supabase
    .from("winners")
    .select("id, verification, payout")
    .eq("id", winnerId)
    .maybeSingle();

  if (!winner) {
    redirect("/admin/winners?error=Winner+not+found.");
  }

  if (winner.verification !== "approved") {
    redirect(
      "/admin/winners?error=Winner+must+be+approved+before+payout.",
    );
  }

  if (winner.payout === "paid") {
    redirect("/admin/winners?error=Winner+payout+is+already+marked+as+paid.");
  }

  const { data: updatedWinner, error } = await supabase
    .from("winners")
    .update({
      payout: "paid",
      payout_completed_at: new Date().toISOString(),
    })
    .eq("id", winnerId)
    .eq("payout", "pending")
    .select("id")
    .maybeSingle();

  if (error || !updatedWinner) {
    redirect(
      `/admin/winners?error=${encodeURIComponent(error?.message ?? "Winner state changed. Please refresh and try again.")}`,
    );
  }

  redirect("/admin/winners?success=paid");
}
