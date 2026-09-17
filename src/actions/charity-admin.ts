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

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function isValidExternalUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createCharity(formData: FormData) {
  const supabase = await requireAdmin();

  const name = value(formData, "name");
  const slug = value(formData, "slug");
  const description = value(formData, "description");
  const imageUrl = value(formData, "imageUrl");
  const websiteUrl = value(formData, "websiteUrl");

  const featured = formData.get("featured") === "on";

  if (!name || !slug || !description) {
    redirect(
      "/admin/charities?error=Name,+slug+and+description+are+required.",
    );
  }

  if (!isValidExternalUrl(imageUrl) || !isValidExternalUrl(websiteUrl)) {
    redirect("/admin/charities?error=Image+and+website+URLs+must+use+http+or+https.");
  }

  if (featured) {
    await supabase
      .from("charities")
      .update({ featured: false })
      .eq("featured", true);
  }

  const { error } = await supabase.from("charities").insert({
    name,
    slug,
    description,
    image_url: imageUrl || null,
    website_url: websiteUrl || null,
    is_active: true,
    featured,
  });

  if (error) {
    redirect(
      `/admin/charities?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/admin/charities?success=created");
}

export async function updateCharity(formData: FormData) {
  const supabase = await requireAdmin();

  const id = value(formData, "id");
  const name = value(formData, "name");
  const slug = value(formData, "slug");
  const description = value(formData, "description");
  const imageUrl = value(formData, "imageUrl");
  const websiteUrl = value(formData, "websiteUrl");

  const featured = formData.get("featured") === "on";
  const isActive = formData.get("isActive") === "on";

  if (!id || !name || !slug || !description) {
    redirect(
      "/admin/charities?error=Name,+slug+and+description+are+required.",
    );
  }

  if (!isValidExternalUrl(imageUrl) || !isValidExternalUrl(websiteUrl)) {
    redirect("/admin/charities?error=Image+and+website+URLs+must+use+http+or+https.");
  }

  if (featured) {
    await supabase
      .from("charities")
      .update({ featured: false })
      .neq("id", id)
      .eq("featured", true);
  }

  const { data: updatedCharity, error } = await supabase
    .from("charities")
    .update({
      name,
      slug,
      description,
      image_url: imageUrl || null,
      website_url: websiteUrl || null,
      featured,
      is_active: isActive,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !updatedCharity) {
    redirect(
      `/admin/charities?error=${encodeURIComponent(error?.message ?? "Charity not found.")}`,
    );
  }

  redirect("/admin/charities?success=updated");
}

export async function deleteCharity(formData: FormData) {
  const supabase = await requireAdmin();

  const id = value(formData, "id");

  if (!id) {
    redirect("/admin/charities?error=Invalid+charity.");
  }

  const { data: charity } = await supabase
    .from("charities")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!charity) {
    redirect("/admin/charities?error=Charity+not+found.");
  }

  const { error } = await supabase
    .from("charities")
    .delete()
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/charities?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/admin/charities?success=deleted");
}
