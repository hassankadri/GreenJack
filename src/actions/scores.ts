"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/subscription/access";

function getValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function validateScore(score: number, playedOn: string) {
  if (!Number.isInteger(score) || score < 1 || score > 45) {
    redirect(
      "/scores?error=Score+must+be+between+1+and+45.",
    );
  }

  if (!playedOn) {
    redirect(
      "/scores?error=Please+select+a+date.",
    );
  }

  const today = new Date();
  const todayString = today.toISOString().slice(0, 10);

  if (playedOn > todayString) {
    redirect(
      "/scores?error=Score+date+cannot+be+in+the+future.",
    );
  }
}

async function keepLatestFive(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: scores, error } = await supabase
    .from("golf_scores")
    .select("id, played_on")
    .eq("user_id", userId)
    .order("played_on", { ascending: false });

  if (error || !scores || scores.length <= 5) {
    return;
  }

  const idsToDelete = scores
    .slice(5)
    .map((item) => item.id);

  if (idsToDelete.length === 0) {
    return;
  }

  await supabase
    .from("golf_scores")
    .delete()
    .eq("user_id", userId)
    .in("id", idsToDelete);
}

export async function saveScore(formData: FormData) {
  const score = Number(getValue(formData, "score"));
  const playedOn = getValue(formData, "playedOn");

  validateScore(score, playedOn);

  const { supabase, user } =
    await requireActiveSubscription();

  const { data: existingScore, error: existingError } =
    await supabase
      .from("golf_scores")
      .select("id")
      .eq("user_id", user.id)
      .eq("played_on", playedOn)
      .maybeSingle();

  if (existingError) {
    redirect(
      `/scores?error=${encodeURIComponent(
        existingError.message,
      )}`,
    );
  }

  if (existingScore) {
    redirect(
      "/scores?error=A+score+for+this+date+already+exists.+Edit+the+existing+score+instead.",
    );
  }

  const { error } = await supabase
    .from("golf_scores")
    .insert({
      user_id: user.id,
      score,
      played_on: playedOn,
    });

  if (error) {
    redirect(
      `/scores?error=${encodeURIComponent(error.message)}`,
    );
  }

  await keepLatestFive(supabase, user.id);

  redirect("/scores?success=Score+saved.");
}

export async function editScore(formData: FormData) {
  const scoreId = getValue(formData, "scoreId");
  const score = Number(getValue(formData, "score"));
  const playedOn = getValue(formData, "playedOn");

  if (!scoreId) {
    redirect("/scores?error=Invalid+score.");
  }

  validateScore(score, playedOn);

  const { supabase, user } =
    await requireActiveSubscription();

  const { data: existingScore, error: existingError } =
    await supabase
      .from("golf_scores")
      .select("id")
      .eq("id", scoreId)
      .eq("user_id", user.id)
      .maybeSingle();

  if (existingError || !existingScore) {
    redirect(
      "/scores?error=The+score+could+not+be+found.",
    );
  }

  const { data: duplicateScore, error: duplicateError } =
    await supabase
      .from("golf_scores")
      .select("id")
      .eq("user_id", user.id)
      .eq("played_on", playedOn)
      .neq("id", scoreId)
      .maybeSingle();

  if (duplicateError) {
    redirect(
      `/scores?error=${encodeURIComponent(
        duplicateError.message,
      )}`,
    );
  }

  if (duplicateScore) {
    redirect(
      "/scores?error=Another+score+already+uses+this+date.",
    );
  }

  const { error } = await supabase
    .from("golf_scores")
    .update({
      score,
      played_on: playedOn,
    })
    .eq("id", scoreId)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/scores?error=${encodeURIComponent(error.message)}`,
    );
  }

  await keepLatestFive(supabase, user.id);

  redirect("/scores?success=Score+updated.");
}

export async function deleteScore(formData: FormData) {
  const scoreId = getValue(formData, "scoreId");

  if (!scoreId) {
    redirect("/scores?error=Invalid+score.");
  }

  const { supabase, user } =
    await requireActiveSubscription();

  const { data: deletedScore, error } = await supabase
    .from("golf_scores")
    .delete()
    .eq("id", scoreId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !deletedScore) {
    redirect(
      `/scores?error=${encodeURIComponent(error?.message ?? "The score could not be found.")}`,
    );
  }

  redirect("/scores?success=Score+deleted.");
}
