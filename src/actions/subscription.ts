"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function saveCharityPreference(formData: FormData) {
  const charityId = getValue(formData, "charityId");
  const contributionPercent = Number(
    getValue(formData, "contributionPercent"),
  );

  if (!charityId) {
    redirect("/subscribe?error=Please+select+a+charity.");
  }

  if (
    !Number.isFinite(contributionPercent) ||
    contributionPercent < 10 ||
    contributionPercent > 100
  ) {
    redirect(
      "/subscribe?error=Charity+contribution+must+be+between+10%25+and+100%25.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: charity } = await supabase
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .eq("is_active", true)
    .maybeSingle();

  if (!charity) {
    redirect("/subscribe?error=Charity+not+found+or+inactive.");
  }

  const { error } = await supabase
    .from("charity_preferences")
    .upsert({
      user_id: user.id,
      charity_id: charityId,
      contribution_percent: contributionPercent,
    });

  if (error) {
    redirect(
      `/subscribe?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/subscribe?success=charity");
}

