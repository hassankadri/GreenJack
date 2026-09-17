import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireActiveSubscription() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    redirect(
      `/subscribe?error=${encodeURIComponent(
        "Unable to verify your membership.",
      )}`,
    );
  }

  const periodHasEnded =
    subscription?.current_period_end
      ? new Date(subscription.current_period_end) <= new Date()
      : false;

  if (!subscription || periodHasEnded) {
    redirect(
      "/subscribe?error=Active+membership+required.",
    );
  }

  return {
    supabase,
    user,
    subscription,
  };
}