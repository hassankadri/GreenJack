import { RefreshCw, Send } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  createCurrentDraw,
  publishCurrentDraw,
  simulateCurrentDraw,
  voidCurrentDraw,
} from "@/actions/draw-admin";
import BackButton from "../../../components/BackButton";

type DrawsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatMonth(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminDrawsPage({
  searchParams,
}: DrawsPageProps) {
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

  const { data: draws } = await supabase
    .from("draws")
    .select(
      "id, draw_month, mode, status, winning_numbers, active_subscriber_count, prize_pool_amount, jackpot_carried_in, jackpot_carried_out, created_at, published_at",
    )
    .order("draw_month", { ascending: false });

  const currentMonth = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1,
  ).padStart(2, "0")}-01`;

  const currentDraw =
    draws?.find((draw) => draw.draw_month === currentMonth) ?? null;

  return (
    <main className="min-h-screen bg-[var(--dh-charcoal)] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <BackButton fallback="/admin" label="Admin dashboard" className="hover:text-white" />

        <section className="pt-10">
          <p className="dh-eyebrow text-zinc-500">
            Draw management
          </p>

          <h1 className="dh-display mt-4 max-w-4xl text-6xl sm:text-7xl">
            Create.
            <br />
            <span className="font-[var(--font-instrument-serif)] italic text-[var(--dh-sage)]">
              Simulate. Publish.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400">
            Manage the monthly draw, choose the draw method and
            publish results when everything has been reviewed.
          </p>
        </section>

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {params.error}
          </div>
        )}

        {params.success && (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-300">
            {params.success === "created" &&
              "Current month draw created."}

            {params.success === "simulated" &&
              "Winning numbers generated successfully."}

            {params.success === "published" &&
              "Draw published and winners processed."}

            {params.success === "voided" &&
              "Draw voided. You can now simulate a new result."}
          </div>
        )}

        <section className="mt-10">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Current month
                </p>

                <h2 className="mt-2 text-3xl font-semibold">
                  {formatMonth(currentMonth)}
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  {currentDraw
                    ? `${currentDraw.status} · ${currentDraw.mode}`
                    : "No draw created yet."}
                </p>
              </div>

              {!currentDraw && (
                <form
                  action={createCurrentDraw}
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <select
                    name="mode"
                    defaultValue="random"
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white outline-none"
                  >
                    <option
                      value="random"
                      className="text-zinc-900"
                    >
                      Random draw
                    </option>

                    <option
                      value="algorithmic"
                      className="text-zinc-900"
                    >
                      Algorithmic draw
                    </option>
                  </select>

                  <button
                    type="submit"
                    className="dh-button rounded-full bg-[var(--dh-sage)] text-zinc-900"
                  >
                    Create draw
                  </button>
                </form>
              )}
            </div>

            {currentDraw && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                    Mode
                  </p>

                  <p className="mt-3 text-xl font-semibold capitalize">
                    {currentDraw.mode}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                    Subscribers
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {currentDraw.active_subscriber_count}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                    Prize pool
                  </p>

                  <p className="mt-3 text-3xl font-semibold">
                    {formatCurrency(currentDraw.prize_pool_amount)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                    Status
                  </p>

                  <p className="mt-3 text-xl font-semibold capitalize">
                    {currentDraw.status}
                  </p>
                </div>
              </div>
            )}

            {currentDraw?.winning_numbers && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-[var(--dh-sage)] p-6 text-zinc-900">
                <p className="text-xs font-semibold uppercase tracking-[0.15em]">
                  Simulated winning numbers
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {currentDraw.winning_numbers.map(
                    (number: number) => (
                      <span
                        key={number}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-lg font-semibold text-white"
                      >
                        {number}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            {currentDraw?.status === "draft" && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {!currentDraw.winning_numbers && (
                  <form action={simulateCurrentDraw}>
                    <button
                      type="submit"
                      className="dh-button dh-button-secondary border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Simulate draw
                    </button>
                  </form>
                )}

                {currentDraw.winning_numbers && (
                  <form action={simulateCurrentDraw}>
                    <button
                      type="submit"
                      className="dh-button dh-button-secondary border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Re-simulate
                    </button>
                  </form>
                )}

                {currentDraw.winning_numbers && (
                  <form action={publishCurrentDraw}>
                    <button
                      type="submit"
                      className="dh-button bg-[var(--dh-sage)] text-zinc-900"
                    >
                      <Send className="h-4 w-4" />
                      Publish draw
                    </button>
                  </form>
                )}
              </div>
            )}

            {currentDraw?.status === "published" && (
              <div className="mt-8">
                <form action={voidCurrentDraw}>
                  <button
                    type="submit"
                    className="dh-button border border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                  >
                    Void & redraw
                  </button>
                </form>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="dh-eyebrow text-zinc-500">
                History
              </p>

              <h2 className="mt-2 text-3xl font-semibold">
                Previous draws
              </h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-white/10">
            {draws && draws.length > 0 ? (
              draws.map((draw) => (
                <div
                  key={draw.id}
                  className="border-b border-white/10 bg-white/[0.03] p-6 last:border-b-0"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">
                          {formatMonth(draw.draw_month)}
                        </h3>

                        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium capitalize text-zinc-400">
                          {draw.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-zinc-500">
                        {draw.mode} ·{" "}
                        {draw.active_subscriber_count} subscribers
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {draw.winning_numbers?.map(
                        (number: number) => (
                          <span
                            key={number}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold"
                          >
                            {number}
                          </span>
                        ),
                      )}
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-sm text-zinc-500">
                        Prize pool
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(draw.prize_pool_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/[0.03] px-6 py-12 text-center text-zinc-500">
                No draws have been created yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
