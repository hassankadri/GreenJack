import {
  CheckCircle2,
  ExternalLink,
  FileImage,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  approveWinner,
  markWinnerPaid,
  rejectWinner,
} from "@/actions/admin-winner";
import BackButton from "../../../components/BackButton";

type AdminWinnersPageProps = {
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

export default async function AdminWinnersPage({
  searchParams,
}: AdminWinnersPageProps) {
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: winners } = await supabase
    .from("winners")
    .select(
      "id, user_id, draw_id, match_count, matched_numbers, prize_amount, verification, payout, proof_path, proof_uploaded_at, created_at",
    )
    .order("created_at", { ascending: false });

  const winnersWithProof = await Promise.all(
    (winners ?? []).map(async (winner) => {
      let proofUrl: string | null = null;

      if (winner.proof_path) {
        const { data } = await supabase.storage
          .from("winner-proofs")
          .createSignedUrl(winner.proof_path, 600);

        proofUrl = data?.signedUrl ?? null;
      }

      return {
        ...winner,
        proofUrl,
      };
    }),
  );

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

        <section className="pt-10">
          <p className="dh-eyebrow text-zinc-500">
            Winner management
          </p>

          <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl">
            Verify the win.
            <br />
            <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
              Release the payout.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
            Review submitted proof, approve or reject winners, and
            mark approved prizes as paid.
          </p>
        </section>

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {params.success === "approved" &&
              "Winner approved successfully."}

            {params.success === "rejected" &&
              "Winner rejected successfully."}

            {params.success === "paid" &&
              "Winner payout marked as paid."}
          </div>
        )}

        <section className="mt-10 space-y-5">
          {winnersWithProof.length > 0 ? (
            winnersWithProof.map((winner) => (
              <article
                key={winner.id}
                className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 sm:p-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="dh-eyebrow text-zinc-500">
                      {winner.match_count}-number match
                    </p>

                    <h2 className="mt-2 text-3xl font-semibold">
                      {formatCurrency(winner.prize_amount)}
                    </h2>

                    <p className="mt-4 break-all text-sm text-zinc-500">
                      User ID:{" "}
                      <span className="text-zinc-300">
                        {winner.user_id}
                      </span>
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs capitalize text-zinc-300">
                      Verification: {winner.verification}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs capitalize text-zinc-300">
                      Payout: {winner.payout}
                    </span>
                  </div>
                </div>

                <div className="mt-7 border-t border-white/10 pt-7">
                  <p className="dh-eyebrow text-zinc-500">
                    Matched numbers
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(winner.matched_numbers ?? []).map(
                      (number: number) => (
                        <span
                          key={number}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold"
                        >
                          {number}
                        </span>
                      ),
                    )}
                  </div>

                  <div className="mt-7">
                    <p className="dh-eyebrow text-zinc-500">
                      Proof
                    </p>

                    {winner.proofUrl ? (
                      <a
                        href={winner.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10"
                      >
                        <FileImage className="h-4 w-4" />
                        View proof
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="mt-4 text-sm text-zinc-500">
                        No proof uploaded yet.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  {winner.verification === "pending" &&
                    winner.proof_path && (
                      <>
                        <form action={approveWinner}>
                          <input
                            type="hidden"
                            name="winnerId"
                            value={winner.id}
                          />

                          <button
                            type="submit"
                            className="flex items-center gap-2 rounded-full bg-[var(--dh-sage)] px-5 py-3 text-sm font-semibold text-zinc-900"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </button>
                        </form>

                        <form action={rejectWinner}>
                          <input
                            type="hidden"
                            name="winnerId"
                            value={winner.id}
                          />

                          <button
                            type="submit"
                            className="flex items-center gap-2 rounded-full bg-red-400/10 px-5 py-3 text-sm font-medium text-red-300"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </form>
                      </>
                    )}

                  {winner.verification === "approved" &&
                    winner.payout !== "paid" && (
                      <form action={markWinnerPaid}>
                        <input
                          type="hidden"
                          name="winnerId"
                          value={winner.id}
                        />

                        <button
                          type="submit"
                          className="rounded-full bg-[var(--dh-sage)] px-5 py-3 text-sm font-semibold text-zinc-900"
                        >
                          Mark payout as paid
                        </button>
                      </form>
                    )}
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[30px] border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
              <p className="text-xl font-semibold">
                No winner records yet.
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Winner submissions will appear here after a draw is
                published.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
