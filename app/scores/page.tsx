import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import BackButton from "../../components/BackButton";

import { createClient } from "@/lib/supabase/server";
import {
  deleteScore,
  editScore,
  saveScore,
} from "@/actions/scores";

type ScoresPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    edit?: string;
  }>;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default async function ScoresPage({
  searchParams,
}: ScoresPageProps) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionExpired =
    subscription?.current_period_end
      ? new Date(subscription.current_period_end) <=
        new Date()
      : false;

  const today = new Date().toISOString().slice(0, 10);

  if (
    !subscription ||
    subscriptionExpired
  ) {
    return (
      <main className="min-h-screen bg-[var(--dh-ivory)] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <BackButton fallback="/dashboard" label="Dashboard" />

          <div className="dh-panel mt-8 p-8">
            <p className="dh-eyebrow text-zinc-500">
              Scores
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Membership required
            </h1>

            <p className="mt-3 text-zinc-500">
              You need an active membership before you can
              manage Stableford scores.
            </p>

            <Link
              href="/subscribe"
              className="dh-button dh-button-primary mt-7"
            >
              View membership
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { data: scores } = await supabase
    .from("golf_scores")
    .select("id, score, played_on")
    .eq("user_id", user.id)
    .order("played_on", { ascending: false })
    .limit(5);

  return (
    <main className="min-h-screen bg-[var(--dh-ivory)] px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <BackButton fallback="/dashboard" label="Dashboard" />

        <section className="mt-10">
          <p className="dh-eyebrow text-zinc-500">
            Your game
          </p>

          <h1 className="dh-display mt-4 max-w-3xl text-6xl sm:text-7xl">
            Keep your
            <br />
            <span className="font-[var(--font-instrument-serif)] italic">
              scores current.
            </span>
          </h1>

          <p className="dh-body mt-6 max-w-2xl text-lg">
            Keep your latest five Stableford scores ready for
            your monthly draw entry.
          </p>
        </section>

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {params.success}
          </div>
        )}

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* ADD SCORE */}
          <div className="dh-panel p-7">
            <p className="dh-eyebrow text-zinc-500">
              Add a round
            </p>

            <h2 className="mt-2 text-2xl font-semibold">
              New Stableford score
            </h2>

            <form action={saveScore} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="score"
                  className="mb-2 block text-sm font-medium"
                >
                  Score
                </label>

                <input
                  id="score"
                  name="score"
                  type="number"
                  min="1"
                  max="45"
                  required
                  placeholder="34"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900"
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Stableford score from 1 to 45.
                </p>
              </div>

              <div>
                <label
                  htmlFor="playedOn"
                  className="mb-2 block text-sm font-medium"
                >
                  Date played
                </label>

                <input
                  id="playedOn"
                  name="playedOn"
                  type="date"
                  required
                  max={today}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900"
                />
              </div>

              <button
                type="submit"
                className="dh-button dh-button-primary w-full"
              >
                <Plus className="h-4 w-4" />
                Add score
              </button>
            </form>
          </div>

          {/* SCORE CARD */}
          <div className="dh-panel p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Your card
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Latest five scores
                </h2>
              </div>

              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">
                {scores?.length ?? 0} / 5
              </span>
            </div>

            <div className="mt-7 space-y-3">
              {scores && scores.length > 0 ? (
                scores.map((score, index) => {
                  const isEditing =
                    params.edit === score.id;

                  if (isEditing) {
                    return (
                      <form
                        key={score.id}
                        action={editScore}
                        className="rounded-2xl border border-zinc-300 bg-white p-5"
                      >
                        <input
                          type="hidden"
                          name="scoreId"
                          value={score.id}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`edit-score-${score.id}`}
                              className="mb-2 block text-xs font-medium text-zinc-500"
                            >
                              Stableford score
                            </label>

                            <input
                              id={`edit-score-${score.id}`}
                              name="score"
                              type="number"
                              min="1"
                              max="45"
                              defaultValue={score.score}
                              required
                              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-date-${score.id}`}
                              className="mb-2 block text-xs font-medium text-zinc-500"
                            >
                              Date
                            </label>

                            <input
                              id={`edit-date-${score.id}`}
                              name="playedOn"
                              type="date"
                              defaultValue={score.played_on}
                              required
                              max={today}
                              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900"
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="submit"
                            className="dh-button dh-button-primary flex-1"
                          >
                            <Check className="h-4 w-4" />
                            Save changes
                          </button>

                          <Link
                            href="/scores"
                            className="dh-button dh-button-secondary"
                            aria-label="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </Link>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div
                      key={score.id}
                      className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-[var(--dh-paper)] p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                          {index + 1}
                        </span>

                        <div>
                          <p className="font-medium">
                            {formatDate(score.played_on)}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Stableford score
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-semibold">
                          {score.score}
                        </span>

                        <Link
                          href={`/scores?edit=${score.id}`}
                          aria-label={`Edit score from ${formatDate(
                            score.played_on,
                          )}`}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition hover:border-zinc-900 hover:text-zinc-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>

                        <form action={deleteScore}>
                          <input
                            type="hidden"
                            name="scoreId"
                            value={score.id}
                          />

                          <button
                            type="submit"
                            aria-label="Delete score"
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 text-zinc-400 transition hover:border-red-200 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 px-5 py-12 text-center">
                  <p className="font-medium">
                    No scores added yet.
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Add your latest rounds to build your draw
                    entry.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 rounded-2xl border border-black/10 bg-[#ecd1ba]/40 px-5 py-4 text-sm text-zinc-600">
          Your five most recent scores are kept for draw
          participation. A sixth score automatically removes the
          oldest one.
        </div>
      </div>
    </main>
  );
}
