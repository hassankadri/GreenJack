import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Heart,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";
import BackButton from "../../components/BackButton";

type ProfilePageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

async function updateProfile(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = String(
    formData.get("fullName") ?? "",
  ).trim();

  if (!fullName) {
    redirect("/profile?error=Name+cannot+be+empty.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
    })
    .eq("id", user.id);

  if (profileError) {
    redirect(
      `/profile?error=${encodeURIComponent(
        profileError.message,
      )}`,
    );
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
    },
  });

  if (authError) {
    redirect(
      `/profile?error=${encodeURIComponent(
        authError.message,
      )}`,
    );
  }

  redirect("/profile?success=Profile+updated+successfully.");
}

async function updatePassword(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const password = String(
    formData.get("password") ?? "",
  );

  const confirmPassword = String(
    formData.get("confirmPassword") ?? "",
  );

  if (password.length < 8) {
    redirect(
      "/profile?error=Password+must+be+at+least+8+characters.",
    );
  }

  if (password !== confirmPassword) {
    redirect(
      "/profile?error=Passwords+do+not+match.",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect(
      `/profile?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect(
    "/profile?success=Password+updated+successfully.",
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    "Member";

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join("")
      .toUpperCase() || "M";

  const isEmailVerified = Boolean(user.email_confirmed_at);

  return (
    <main className="min-h-screen bg-[var(--dh-ivory)] px-5 py-8 text-[var(--dh-ink)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* TOP NAV */}
        <div className="flex items-center justify-between">
        <BackButton fallback="/dashboard" label="Dashboard" />

          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>

        {/* HERO */}
        <section className="pt-12">
          <p className="dh-eyebrow text-zinc-500">
            Account
          </p>

          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h1 className="dh-display max-w-4xl text-6xl sm:text-7xl">
                Your
                <br />
                <span className="font-[var(--font-instrument-serif)] italic">
                  space.
                </span>
              </h1>

              <p className="dh-body mt-6 max-w-2xl text-lg">
                Manage your identity, security and membership from
                one place.
              </p>
            </div>

            {/* IDENTITY CARD */}
            <div className="rounded-[32px] bg-[var(--dh-charcoal)] p-6 text-white shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dh-sage)] text-base font-bold text-zinc-900">
                  {initials}
                </div>

                <BadgeCheck className="h-5 w-5 text-[var(--dh-sage)]" />
              </div>

              <p className="mt-8 text-xs uppercase tracking-[0.18em] text-zinc-500">
                {profile?.role === "admin"
                  ? "Administrator"
                  : "Member"}
              </p>

              <p className="mt-2 text-xl font-semibold">
                {fullName}
              </p>

              <p className="mt-1 truncate text-sm text-zinc-500">
                {user.email}
              </p>
            </div>
          </div>
        </section>

        {/* FEEDBACK */}
        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-8 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {params.success}
          </div>
        )}

        {/* ACCOUNT SNAPSHOT */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[26px] border border-black/10 bg-white p-5">
            <CalendarDays className="h-5 w-5 text-zinc-500" />

            <p className="mt-5 text-xs uppercase tracking-[0.15em] text-zinc-400">
              Member since
            </p>

            <p className="mt-2 text-lg font-semibold">
              {formatDate(user.created_at)}
            </p>
          </div>

          <div className="rounded-[26px] border border-black/10 bg-white p-5">
            <ShieldCheck className="h-5 w-5 text-zinc-500" />

            <p className="mt-5 text-xs uppercase tracking-[0.15em] text-zinc-400">
              Email status
            </p>

            <p className="mt-2 text-lg font-semibold">
              {isEmailVerified ? "Verified" : "Unverified"}
            </p>
          </div>

          <div className="rounded-[26px] border border-black/10 bg-white p-5">
            <UserRound className="h-5 w-5 text-zinc-500" />

            <p className="mt-5 text-xs uppercase tracking-[0.15em] text-zinc-400">
              Account type
            </p>

            <p className="mt-2 text-lg font-semibold capitalize">
              {profile?.role ?? "Member"}
            </p>
          </div>

          <div className="rounded-[26px] border border-black/10 bg-white p-5">
            <CheckCircle2 className="h-5 w-5 text-zinc-500" />

            <p className="mt-5 text-xs uppercase tracking-[0.15em] text-zinc-400">
              Last sign in
            </p>

            <p className="mt-2 text-lg font-semibold">
              {formatDate(user.last_sign_in_at)}
            </p>
          </div>
        </section>

        {/* PROFILE + SECURITY */}
        <section className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          {/* PROFILE */}
          <div className="rounded-[32px] border border-black/10 bg-white p-7 sm:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Personal details
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Your identity
                </h2>
              </div>

              <UserRound className="h-5 w-5 text-zinc-400" />
            </div>

            <form action={updateProfile} className="mt-8">
              <label
                htmlFor="fullName"
                className="text-sm font-medium"
              >
                Full name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                defaultValue={fullName}
                required
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-[var(--dh-paper)] px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900"
              />

              <label
                htmlFor="email"
                className="mt-6 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={user.email ?? ""}
                disabled
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500 outline-none"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Your email is managed by your authentication account.
              </p>

              <button
                type="submit"
                className="dh-button dh-button-primary mt-7"
              >
                <Save className="h-4 w-4" />
                Save profile
              </button>
            </form>
          </div>

          {/* SECURITY */}
          <div className="rounded-[32px] bg-[var(--dh-charcoal)] p-7 text-white sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Security
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Stay protected.
                </h2>
              </div>

              <KeyRound className="h-5 w-5 text-[var(--dh-sage)]" />
            </div>

            <form action={updatePassword} className="mt-8">
              <label
                htmlFor="password"
                className="text-sm font-medium"
              >
                New password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                placeholder="Minimum 8 characters"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-white/30"
              />

              <label
                htmlFor="confirmPassword"
                className="mt-5 block text-sm font-medium"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                placeholder="Repeat your password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder:text-zinc-600 outline-none transition focus:border-white/30"
              />

              <button
                type="submit"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--dh-sage)] px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:opacity-90"
              >
                <KeyRound className="h-4 w-4" />
                Update password
              </button>
            </form>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-5">
          <div className="mb-4">
            <p className="dh-eyebrow text-zinc-500">
              Quick access
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Keep playing.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Link
              href="/subscribe"
              className="group rounded-[30px] border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <CreditCard className="h-5 w-5 text-zinc-700" />

              <h3 className="mt-8 text-xl font-semibold">
                Membership
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Manage your plan and charity contribution.
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm font-medium">
                Manage membership
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/scores"
              className="group rounded-[30px] border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Trophy className="h-5 w-5 text-zinc-700" />

              <h3 className="mt-8 text-xl font-semibold">
                Your game
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Enter and update your latest golf scores.
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm font-medium">
                Manage scores
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              href="/charities"
              className="group rounded-[30px] bg-[var(--dh-sage)] p-6 text-zinc-900 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <Heart className="h-5 w-5" />

              <h3 className="mt-8 text-xl font-semibold">
                Your impact
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-700">
                Explore the causes supported by GreenJack.
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm font-medium">
                Explore charities
                <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
