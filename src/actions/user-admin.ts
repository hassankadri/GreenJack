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

  return supabase;
}

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function updateUserProfile(formData: FormData) {
  const supabase = await requireAdmin();

  const userId = getValue(formData, "userId");
  const fullName = getValue(formData, "fullName");

  const isActive = formData.get("isActive") === "on";

  if (!userId) {
    redirect("/admin/users?error=Invalid+user.");
  }

  if (!fullName) {
    redirect(
      "/admin/users?error=Full+name+cannot+be+empty.",
    );
  }

  const { data: updatedUser, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      is_active: isActive,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error || !updatedUser) {
    redirect(
      `/admin/users?error=${encodeURIComponent(error?.message ?? "User not found.")}`,
    );
  }

  redirect("/admin/users?success=user");
}

export async function updateSubscriptionStatus(
  formData: FormData,
) {
  const supabase = await requireAdmin();

  const userId = getValue(formData, "userId");
  const status = getValue(formData, "status");

  const allowedStatuses = new Set([
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "paused",
  ]);

  if (!userId) {
    redirect("/admin/users?error=Invalid+user.");
  }

  if (!allowedStatuses.has(status)) {
    redirect(
      "/admin/users?error=Invalid+subscription+status.",
    );
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    redirect(
      "/admin/users?error=This+user+does+not+have+a+subscription+record.",
    );
  }

  const { data: updatedSubscription, error } = await supabase
    .from("subscriptions")
    .update({
      status,
    })
    .eq("id", subscription.id)
    .select("id")
    .maybeSingle();

  if (error || !updatedSubscription) {
    redirect(
      `/admin/users?error=${encodeURIComponent(error?.message ?? "Subscription record not found.")}`,
    );
  }

  redirect("/admin/users?success=subscription");
}
