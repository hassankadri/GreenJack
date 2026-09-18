"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getValue(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");

  if (!email || !password) {
    redirectWithError("/login", "Email and password are required.");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirectWithError("/login", "Invalid email or password.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.role === "admin" ? "/admin" : "/dashboard");
}

export async function signup(formData: FormData) {
  const fullName = getValue(formData, "fullName");
  const email = getValue(formData, "email");
  const password = getValue(formData, "password");

  if (!fullName || !email || !password) {
    redirectWithError("/signup", "All fields are required.");
  }

  if (password.length < 8) {
    redirectWithError(
      "/signup",
      "Password must be at least 8 characters.",
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
    },
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
});

  if (error) {
    redirectWithError("/signup", error.message);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  redirect(
    "/login?message=Account created. Check your email if confirmation is required.",
  );
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}
