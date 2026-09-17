import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Sparkles,
  Trophy,
} from "lucide-react";
import SmoothScrollButton from "../components/SmoothScrollButton";



import { createClient } from "@/lib/supabase/server";

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
  }).format(Number(amount ?? 0));
}

export default async function Home() {
  const supabase = await createClient();

  const [
    { data: featuredCharity },
    { data: latestDraw },
    { count: charityCount },
  ] = await Promise.all([
    supabase
      .from("charities")
      .select("id, name, description")
      .eq("is_active", true)
      .eq("featured", true)
      .order("name")
      .limit(1)
      .maybeSingle(),

    supabase
      .from("draws")
      .select(
        "draw_month, winning_numbers, prize_pool_amount",
      )
      .eq("status", "published")
      .order("draw_month", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("charities")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_active", true),
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--dh-ivory)] text-[var(--dh-ink)]">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative">
        <div className="dh-orb dh-orb-sage absolute -left-40 top-24 h-[32rem] w-[32rem] opacity-50" />

        <div className="dh-orb dh-orb-orange absolute -right-40 top-[28rem] h-[28rem] w-[28rem] opacity-40" />

        <div className="relative mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
          {/* NAV */}
          <nav className="flex items-center justify-between border-b border-black/10 pb-5">
            <Link
              href="/"
              className="group flex items-center gap-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dh-charcoal)] text-sm font-semibold text-white transition duration-500 group-hover:rotate-6 group-hover:scale-105">
                G
              </span>

              <div>
                <p className="text-sm font-semibold tracking-[0.16em] uppercase">
                  GreenJack
                </p>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Play. Win. Give back.
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/charities"
                className="inline-flex min-h-11 items-center rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-medium text-zinc-700 backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-zinc-900"
              >
              Charities
              </Link>

              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-full border border-black/10 bg-white/60 px-4 py-2.5 text-sm font-medium transition duration-200 hover:-translate-y-0.5 hover:bg-white"
              >
                Log in
              </Link>
            </div>
          </nav>

          {/* HERO */}
          <div className="grid min-h-[760px] gap-16 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="dh-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3.5 py-2 text-xs font-medium text-zinc-600 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                A membership with purpose
              </div>

              <h1 className="dh-display mt-7 max-w-5xl text-[4.5rem] sm:text-8xl lg:text-[8.3rem]">
                Your game.
                <br />
                <span className="font-[var(--font-instrument-serif)] italic">
                  More meaningful.
                </span>
              </h1>

              <p className="dh-body mt-8 max-w-2xl text-lg leading-8 sm:text-xl">
                GreenJack combines golf performance tracking,
                monthly prize draws and charitable giving into one
                membership.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/subscribe"
                  className="dh-button dh-button-primary group"
                >
                  Become a member
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>

                <Link
                  href="#how-it-works"
                  className="dh-button dh-button-secondary group"
                >
                  See how it works
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-zinc-500">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-zinc-700" />
                  Monthly or yearly membership
                </span>

                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-zinc-700" />
                  Choose your cause
                </span>
              </div>
            </div>

            {/* HERO EXPLANATION CARD */}
            <div className="dh-fade-up dh-delay-2 relative">
              <div className="absolute -inset-10 rounded-[4rem] bg-[var(--dh-sage)]/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[40px] bg-[var(--dh-charcoal)] p-7 text-white shadow-2xl sm:p-9">
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--dh-sage)]/10 blur-3xl" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="dh-eyebrow text-zinc-500">
                        In one sentence
                      </p>

                      <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
                        Play your rounds.
                        <br />
                        Enter the draw.
                        <br />
                        Give something back.
                      </h2>
                    </div>

                    <Heart className="h-6 w-6 text-[var(--dh-sage)]" />
                  </div>

                  <div className="mt-10 space-y-3">
                    <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:translate-x-1 hover:bg-white/[0.07]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dh-sage)] text-sm font-semibold text-zinc-900">
                        01
                      </span>

                      <div>
                        <p className="font-semibold">
                          Track your game
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Keep your latest Stableford scores on your card.
                        </p>
                      </div>
                    </div>

                    <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:translate-x-1 hover:bg-white/[0.07]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                        02
                      </span>

                      <div>
                        <p className="font-semibold">
                          Take your chance
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Participate in the monthly number draw.
                        </p>
                      </div>
                    </div>

                    <div className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:translate-x-1 hover:bg-white/[0.07]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                        03
                      </span>

                      <div>
                        <p className="font-semibold">
                          Create an impact
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Direct part of your membership to a chosen cause.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/10 pt-6">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      Active causes
                    </p>

                    <p className="mt-2 text-2xl font-semibold">
                      {charityCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-5 flex justify-center pb-4">
            <SmoothScrollButton />
          </div>
          </div>
      </section>

      {/* =====================================================
          WHAT IS GREENJACK
      ====================================================== */}
      <section
        id="how-it-works"
        className="border-t border-black/10 bg-[var(--dh-paper)]"
      >
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="dh-fade-up">
              <p className="dh-eyebrow text-zinc-500">
                What is GreenJack?
              </p>

              <h2 className="dh-display mt-5 text-5xl sm:text-6xl">
                More than
                <br />
                <span className="font-[var(--font-instrument-serif)] italic">
                  a draw.
                </span>
              </h2>
            </div>

            <div className="dh-fade-up dh-delay-1">
              <p className="max-w-3xl text-xl leading-9 text-zinc-600 sm:text-2xl">
                It is a membership built around three things:
                keeping track of your golf, getting a monthly chance
                at a prize and turning part of your membership into
                charitable impact.
              </p>

              <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-500">
                You choose your membership, choose a cause and keep
                your latest scores up to date. Each month, eligible
                members participate in a draw with three prize
                matching tiers.
              </p>
            </div>
          </div>

          {/* JOURNEY */}
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                label: "JOIN",
                title: "Choose your membership",
                text: "Pick the plan that fits you and start your GreenJack journey.",
              },
              {
                number: "02",
                label: "PLAY",
                title: "Keep your game current",
                text: "Enter your latest Stableford scores and stay eligible for monthly participation.",
              },
              {
                number: "03",
                label: "IMPACT",
                title: "Choose what you support",
                text: "Select a cause and decide the percentage of your membership you want to contribute.",
              },
            ].map((item, index) => (
              <div
                key={item.number}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
                className="dh-fade-up group rounded-[32px] border border-black/10 bg-white p-7 transition duration-400 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-[0.18em] text-zinc-400">
                    {item.number}
                  </span>

                  <span className="rounded-full bg-[var(--dh-sage-soft)] px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-zinc-700">
                    {item.label}
                  </span>
                </div>

                <h3 className="mt-14 text-2xl font-semibold tracking-tight transition-transform duration-300 group-hover:translate-x-1">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-zinc-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          THE MONTHLY CYCLE
      ====================================================== */}
      <section className="bg-[var(--dh-ivory)]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="dh-eyebrow text-zinc-500">
              Every month
            </p>

            <h2 className="dh-display mt-5 text-5xl sm:text-6xl">
              Here&apos;s how
              <br />
              <span className="font-[var(--font-instrument-serif)] italic">
                the game works.
              </span>
            </h2>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <div className="rounded-[34px] bg-[var(--dh-charcoal)] p-8 text-white sm:p-10">
              <Trophy className="h-7 w-7 text-[var(--dh-sage)]" />

              <p className="dh-eyebrow mt-12 text-zinc-500">
                Monthly draw
              </p>

              <h3 className="mt-4 text-4xl font-semibold tracking-tight">
                Five numbers.
                <br />
                Three ways to match.
              </h3>

              <p className="mt-5 text-sm leading-7 text-zinc-400">
                The draw uses five numbers. Match three, four or all
                five to qualify for the corresponding prize tier.
              </p>

              <div className="mt-8 flex gap-2">
                {[16, 18, 28, 34, 41].map((number, index) => (
                  <span
                    key={number}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                    className="dh-fade-up flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-900 transition duration-300 hover:-translate-y-1 hover:scale-105"
                  >
                    {number}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  match: "5 MATCH",
                  share: "40%",
                  note: "Jackpot can roll over.",
                },
                {
                  match: "4 MATCH",
                  share: "35%",
                  note: "Shared equally between winners.",
                },
                {
                  match: "3 MATCH",
                  share: "25%",
                  note: "Shared equally between winners.",
                },
              ].map((item, index) => (
                <div
                  key={item.match}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                  className="dh-fade-up rounded-[30px] border border-black/10 bg-white p-7 transition duration-300 hover:-translate-y-2 hover:shadow-lg"
                >
                  <p className="dh-eyebrow text-zinc-400">
                    {item.match}
                  </p>

                  <p className="mt-8 text-5xl font-semibold tracking-tight">
                    {item.share}
                  </p>

                  <p className="mt-4 text-sm leading-6 text-zinc-500">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURED CHARITY
      ====================================================== */}
      {featuredCharity && (
        <section className="bg-[var(--dh-charcoal)] text-white">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
            <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Featured cause
                </p>

                <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                  <Heart className="h-7 w-7 text-[var(--dh-sage)]" />
                </div>
              </div>

              <div>
                <h2 className="text-5xl font-semibold tracking-tight sm:text-6xl">
                  {featuredCharity.name}
                </h2>

                <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
                  {featuredCharity.description}
                </p>

                <Link
                  href={`/charities/${featuredCharity.id}`}
                  className="dh-button mt-8 bg-[var(--dh-sage)] text-zinc-900 group"
                >
                  Learn about the cause
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          LATEST DRAW
      ====================================================== */}
      {latestDraw && (
        <section className="bg-[var(--dh-paper)]">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Latest published result
                </p>

                <h2 className="dh-display mt-5 text-5xl sm:text-6xl">
                  The numbers
                  <br />
                  <span className="font-[var(--font-instrument-serif)] italic">
                    are in.
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-zinc-500">
                  See how the latest monthly draw came together.
                </p>
              </div>

              <div className="rounded-[32px] border border-black/10 bg-white p-7 shadow-lg sm:min-w-[430px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="dh-eyebrow text-zinc-400">
                      {formatMonth(latestDraw.draw_month)}
                    </p>

                    <p className="mt-2 text-sm text-zinc-500">
                      Published
                    </p>
                  </div>

                  <Trophy className="h-5 w-5 text-zinc-500" />
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  {(latestDraw.winning_numbers ?? []).map(
                    (number: number, index: number) => (
                      <span
                        key={number}
                        style={{
                          animationDelay: `${index * 90}ms`,
                        }}
                        className="dh-fade-up flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dh-charcoal)] text-sm font-semibold text-white transition duration-300 hover:-translate-y-1 hover:scale-105"
                      >
                        {number}
                      </span>
                    ),
                  )}
                </div>

                <div className="mt-7 border-t border-black/10 pt-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                    Prize pool
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(
                      latestDraw.prize_pool_amount,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          FAQ / EXPLAINER
      ====================================================== */}
      <section className="bg-[var(--dh-ivory)]">
        <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8">
          <div className="text-center">
            <p className="dh-eyebrow text-zinc-500">
              Before you join
            </p>

            <h2 className="dh-display mt-5 text-5xl sm:text-6xl">
              Everything you need
              <br />
              <span className="font-[var(--font-instrument-serif)] italic">
                to know.
              </span>
            </h2>
          </div>

          <div className="mt-12 space-y-3">
            {[
              {
                q: "What do I get with membership?",
                a: "You get access to the GreenJack member experience, including score tracking and participation in the monthly draw.",
              },
              {
                q: "How does the charity part work?",
                a: "You choose a cause and set the percentage of your subscription you want to contribute, with a minimum contribution of 10%.",
              },
              {
                q: "How does the draw work?",
                a: "Each monthly draw uses five numbers. Members can qualify by matching three, four or five numbers.",
              },
              {
                q: "Can I choose between monthly and yearly membership?",
                a: "Yes. GreenJack supports both monthly and yearly membership plans.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-[24px] border border-black/10 bg-white px-6 py-5 transition duration-300 open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-semibold">
                  <span>{item.q}</span>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 transition duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="max-w-3xl pt-4 text-sm leading-7 text-zinc-500">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="bg-[var(--dh-sage)]">
        <div className="mx-auto max-w-7xl px-5 py-28 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="dh-eyebrow text-zinc-700">
                Ready?
              </p>

              <h2 className="dh-display mt-5 max-w-4xl text-6xl sm:text-7xl">
                Make your
                <br />
                membership
                <br />
                <span className="font-[var(--font-instrument-serif)] italic">
                  mean something.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-zinc-700">
                Join the game, keep your scores current and choose
                the cause you want to support.
              </p>
            </div>

            <Link
              href="/subscribe"
              className="dh-button bg-[var(--dh-charcoal)] text-white group"
            >
              Start your membership
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--dh-charcoal)] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div>
            <p className="font-semibold tracking-[0.14em] uppercase">
              GreenJack
            </p>

            <p className="mt-1 text-zinc-500">
              Play. Win. Give back.
            </p>
          </div>

          <div className="flex gap-5 text-zinc-500">
            <Link
              href="/charities"
              className="inline-flex min-h-11 items-center transition hover:text-white"
            >
              Charities
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center transition hover:text-white"
            >
              Log in
            </Link>

            <Link
              href="/subscribe"
              className="inline-flex min-h-11 items-center transition hover:text-white"
            >
              Join
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
