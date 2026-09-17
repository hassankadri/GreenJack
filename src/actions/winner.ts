"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function uploadWinnerProof(formData: FormData) {
  const winnerId = String(formData.get("winnerId") ?? "").trim();
  const file = formData.get("proof");

  if (!winnerId) {
    redirect("/winners?error=Invalid+winner.");
  }

  if (!(file instanceof File)) {
    redirect("/winners?error=Please+select+a+file.");
  }

  if (file.size === 0) {
    redirect("/winners?error=The+selected+file+is+empty.");
  }

  if (file.size > MAX_FILE_SIZE) {
    redirect("/winners?error=File+must+be+smaller+than+5MB.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    redirect(
      "/winners?error=Only+JPG,+PNG+and+WebP+images+are+allowed.",
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: winner } = await supabase
    .from("winners")
    .select("id, user_id, verification, proof_path")
    .eq("id", winnerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!winner) {
    redirect("/winners?error=Winner+record+not+found.");
  }

  if (winner.verification === "approved") {
    redirect(
      "/winners?error=This+winner+record+has+already+been+approved.",
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";

  const path = `${user.id}/${winner.id}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("winner-proofs")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    redirect(
      `/winners?error=${encodeURIComponent(uploadError.message)}`,
    );
  }

  const { error: updateError } = await supabase
    .from("winners")
    .update({
      proof_path: path,
      proof_uploaded_at: new Date().toISOString(),
      verification: "pending",
      payout: "pending",
    })
    .eq("id", winner.id)
    .eq("user_id", user.id);

  if (updateError) {
    await supabase.storage
      .from("winner-proofs")
      .remove([path]);

    redirect(
      `/winners?error=${encodeURIComponent(updateError.message)}`,
    );
  }

  if (winner.proof_path && winner.proof_path !== path) {
    await supabase.storage
      .from("winner-proofs")
      .remove([winner.proof_path]);
  }

  redirect("/winners?success=proof");
}
