"use server";

import { redirect } from "next/navigation";

import { requireActiveSubscription } from "@/lib/subscription/access";
import { buildTicketFromScores } from "@/lib/draw/draw-engine";

export async function enterCurrentDraw() {
  const { supabase, user } =
    await requireActiveSubscription();

  const { data: scores, error: scoresError } =
    await supabase
      .from("golf_scores")
      .select("score, played_on")
      .eq("user_id", user.id)
      .order("played_on", { ascending: false })
      .limit(5);

  if (scoresError) {
    redirect(
      `/draw?error=${encodeURIComponent(
        scoresError.message,
      )}`,
    );
  }

  if (!scores || scores.length !== 5) {
    redirect(
      "/draw?error=Add+five+scores+before+entering+the+draw.",
    );
  }

  const today = new Date();

  const drawMonth =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-01`;

  const { data: draw, error: drawError } =
    await supabase
      .from("draws")
      .select("id, draw_month, status")
      .eq("draw_month", drawMonth)
      .eq("status", "draft")
      .maybeSingle();

  if (drawError) {
    redirect(
      `/draw?error=${encodeURIComponent(
        drawError.message,
      )}`,
    );
  }

  if (!draw) {
    redirect(
      "/draw?error=There+is+no+open+draw+available+right+now.",
    );
  }

  const ticketNumbers = buildTicketFromScores(
    scores.map((item) => item.score),
  );

  const { error: entryError } =
    await supabase
      .from("draw_entries")
      .insert({
        draw_id: draw.id,
        user_id: user.id,
        ticket_numbers: ticketNumbers,
      });

  if (entryError) {
    if (entryError.code === "23505") {
      redirect(
        "/draw?error=You+have+already+entered+this+draw.",
      );
    }

    redirect(
      `/draw?error=${encodeURIComponent(
        entryError.message,
      )}`,
    );
  }

  redirect("/draw?success=entered");
}
