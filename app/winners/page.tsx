import { CheckCircle2, Clock3, Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { uploadWinnerProof } from "@/actions/winner";
import BackButton from "../../components/BackButton";

type WinnersPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function WinnersPage({
  searchParams,
}: WinnersPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: winners } = await supabase
    .from("winners")
    .select(
      "id, match_count, prize_amount, verification, payout, proof_path, proof_uploaded_at, created_at, draw_id",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[var(--dh-ivory)] px-5 py-10 text-[var(--dh-ink)] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <BackButton fallback="/dashboard" label="Dashboard" />

        <section className="pt-12">
          <p className="dh-eyebrow text-zinc-500">
            Winner verification
          </p>

          <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl">
            You won.
            <br />
            <span className="font-[var(--font-instrument-serif)] italic">
              Now verify it.
            </span>
          </h1>

          <p className="dh-body mt-6 max-w-2xl text-lg">
            Upload a screenshot of your golf scores so the GreenJack
            team can review your win.
          </p>
        </section>

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {params.error}
          </div>
        )}

        {params.success === "proof" && (
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            Your proof was uploaded and is now pending review.
          </div>
        )}

        <section className="mt-10 space-y-5">
          {winners && winners.length > 0 ? (
            winners.map((winner) => (
              <div
                key={winner.id}
                className="dh-panel p-7 sm:p-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dh-sage-soft)]">
                        <Trophy className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-zinc-500">
                          {winner.match_count}-number match
                        </p>

                        <h2 className="text-3xl font-semibold">
                          {formatCurrency(winner.prize_amount)}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-5 text-sm text-zinc-500">
                      Winning record created on{" "}
                      {formatDate(winner.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium capitalize text-zinc-600">
                      {winner.verification}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        winner.payout === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {winner.payout === "paid"
                        ? "Paid"
                        : "Payout pending"}
                    </span>
                  </div>
                </div>

                <div className="mt-7 border-t border-black/10 pt-7">
                  {winner.verification === "approved" ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                      <CheckCircle2 className="h-5 w-5" />
                      Your winning submission has been approved.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 px-5 py-4">
                        <Clock3 className="mt-0.5 h-5 w-5 text-zinc-500" />

                        <div>
                          <p className="font-medium">
                            {winner.proof_path
                              ? "Proof submitted"
                              : "Proof required"}
                          </p>

                          <p className="mt-1 text-sm leading-6 text-zinc-500">
                            {winner.proof_path
                              ? "Your screenshot is waiting for admin review."
                              : "Upload a screenshot showing the scores associated with this win."}
                          </p>
                        </div>
                      </div>

                      <form
                        action={uploadWinnerProof}
                        encType="multipart/form-data"
                        className="mt-6"
                      >
                        <input
                          type="hidden"
                          name="winnerId"
                          value={winner.id}
                        />

                        <label
                          htmlFor={`proof-${winner.id}`}
                          className="block text-sm font-medium"
                        >
                          {winner.proof_path
                            ? "Replace proof"
                            : "Upload proof"}
                        </label>

                        <input
                          id={`proof-${winner.id}`}
                          name="proof"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          required
                          className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900"
                        />

                        <p className="mt-2 text-xs text-zinc-500">
                          JPG, PNG or WebP. Maximum 5MB.
                        </p>

                        <button
                          type="submit"
                          className="dh-button dh-button-primary mt-5"
                        >
                          {winner.proof_path
                            ? "Replace proof"
                            : "Upload proof"}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="dh-panel p-10 text-center">
              <Trophy className="mx-auto h-10 w-10 text-zinc-400" />

              <h2 className="mt-5 text-2xl font-semibold">
                No winning records yet.
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                When you win a draw, your prize and verification
                details will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
