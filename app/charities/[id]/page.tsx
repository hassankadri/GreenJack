import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Globe2,
  Heart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import BackButton from "../../../components/BackButton";
import { createClient } from "@/lib/supabase/server";

type CharityPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CharityDetailPage({
  params,
}: CharityPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: charity, error } = await supabase
    .from("charities")
    .select(
      `
        id,
        name,
        description,
        image_url,
        website_url,
        featured
      `,
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !charity) {
    notFound();
  }

  const initials =
    charity.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word: string) => word.charAt(0))
      .join("")
      .toUpperCase() || "C";

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--dh-ivory)] text-[var(--dh-ink)]">
      <div className="relative">
        {/* Background atmosphere */}
        <div className="dh-orb dh-orb-sage absolute -left-40 top-16 h-[32rem] w-[32rem] opacity-45" />

        <div className="dh-orb dh-orb-orange absolute -right-40 top-[36rem] h-[30rem] w-[30rem] opacity-35" />

        <div className="relative mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-10">
          {/* Navigation */}
          <header className="flex items-center justify-between border-b border-black/10 pb-5">
            <BackButton fallback="/charities" />

            <div className="hidden items-center gap-2 text-xs uppercase tracking-[0.17em] text-zinc-400 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Charity profile
            </div>
          </header>

          {/* Hero */}
          <section className="grid gap-10 py-14 lg:grid-cols-[1.08fr_0.72fr] lg:items-center">
            <div>
              {charity.featured && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--dh-sage-soft)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Featured cause
                </span>
              )}

              <p className="dh-eyebrow mt-6 text-zinc-500">
                Charity profile
              </p>

              <h1 className="dh-display mt-4 max-w-4xl break-words text-6xl sm:text-7xl lg:text-[5.8rem]">
                {charity.name}
              </h1>

              <p className="dh-body mt-7 max-w-2xl break-words text-lg">
                {charity.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {charity.website_url && (
                  <a
                    href={charity.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dh-button dh-button-primary"
                  >
                    Visit official website
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}

                <Link
                  href={`/subscribe?charityId=${charity.id}`}
                  className="dh-button dh-button-secondary"
                >
                  Support this cause
                  <Heart className="h-4 w-4" />
                </Link>

                <Link
                  href={`/charities/${charity.id}/donate`}
                  className="dh-button dh-button-secondary"
                >
                  Make a one-time donation
                  <Heart className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Impact card */}
            <div className="dh-panel-dark relative overflow-hidden p-8 sm:p-9">
              <div className="dh-orb dh-orb-sage -right-24 -top-24 h-72 w-72 opacity-40" />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dh-sage)] text-zinc-900">
                  <Heart className="h-6 w-6" />
                </div>

                <p className="dh-eyebrow mt-8 text-zinc-500">
                  Your impact
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Know the cause behind your choice.
                </h2>

                <p className="mt-4 text-sm leading-7 text-zinc-400">
                      GreenJack lets members direct at least 10% of
                  their subscription towards a cause they select.
                </p>

                <div className="mt-8 border-t border-white/10 pt-7">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    What this organisation focuses on
                  </p>

                  <p className="mt-2 break-words text-lg font-medium">
                    {charity.description}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick facts */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="dh-panel p-6">
              <ShieldCheck className="h-5 w-5 text-zinc-500" />

              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-zinc-400">
                Directory status
              </p>

              <p className="mt-2 font-semibold">
                Active cause
              </p>
            </div>

            <div className="dh-panel p-6">
              <Sparkles className="h-5 w-5 text-zinc-500" />

              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-zinc-400">
                GreenJack status
              </p>

              <p className="mt-2 font-semibold">
                {charity.featured ? "Featured cause" : "Community cause"}
              </p>
            </div>

            <div className="dh-panel p-6">
              <Heart className="h-5 w-5 text-zinc-500" />

              <p className="mt-5 text-xs uppercase tracking-[0.14em] text-zinc-400">
                Giving model
              </p>

              <p className="mt-2 font-semibold">
                Subscription contribution
              </p>
            </div>
          </section>

          {/* About organisation */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="dh-panel overflow-hidden">
              <div className="relative min-h-[430px]">
                {charity.image_url ? (
                  <div
                    role="img"
                    aria-label={charity.name}
                    className="absolute inset-0 bg-cover bg-center transition duration-700 hover:scale-[1.02]"
                    style={{
                      backgroundImage: `url("${charity.image_url}")`,
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[var(--dh-sage-soft)]">
                    <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/30 blur-3xl" />

                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--dh-charcoal)] text-2xl font-semibold text-white shadow-2xl">
                          {initials}
                        </div>

                        <p className="mt-5 break-words text-base font-semibold text-zinc-700">
                          {charity.name}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Charity profile
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="dh-panel p-8 sm:p-9">
              <p className="dh-eyebrow text-zinc-500">
                About the organisation
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Who they are.
                <br />
                What they do.
              </h2>

              <p className="mt-6 break-words text-base leading-8 text-zinc-600">
                {charity.description}
              </p>

              <div className="mt-8 rounded-2xl bg-[var(--dh-sage-soft)] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Why your contribution matters
                </p>

                <p className="mt-3 text-sm leading-7 text-zinc-700">
                  Your membership lets you choose the cause you want
                  your charitable contribution to support. The selected
                  cause is stored with your membership preference.
                </p>
              </div>

              <div className="mt-8 space-y-5 border-t border-black/10 pt-7">
                {charity.website_url && (
                  <div className="flex gap-3">
                    <Globe2 className="mt-0.5 h-5 w-5 text-zinc-500" />

                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">
                        Official website
                      </p>

                      <a
                        href={charity.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                      >
                        Visit organisation
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* How your membership helps */}
          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            <div className="dh-panel p-7">
              <p className="dh-eyebrow text-zinc-500">
                01 · Choose
              </p>

              <h3 className="mt-3 text-2xl font-semibold">
                Pick this cause
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Select this organisation when setting up your GreenJack
                membership.
              </p>
            </div>

            <div className="dh-panel p-7">
              <p className="dh-eyebrow text-zinc-500">
                02 · Contribute
              </p>

              <h3 className="mt-3 text-2xl font-semibold">
                Direct part of your fee
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                A minimum of 10% of your subscription can be directed
                towards your selected cause.
              </p>
            </div>

            <div className="dh-panel p-7">
              <p className="dh-eyebrow text-zinc-500">
                03 · Stay involved
              </p>

              <h3 className="mt-3 text-2xl font-semibold">
                Follow the impact
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Follow the organisation&apos;s profile and keep up with
                upcoming community events.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="mt-8 rounded-[32px] bg-[var(--dh-charcoal)] p-8 text-white sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="dh-eyebrow text-zinc-500">
                  Make your choice
                </p>

                <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Play your round.
                  <br />
                  Support this cause.
                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                  Continue to membership and this organisation will
                  already be selected for you.
                </p>
              </div>

              <Link
                href={`/subscribe?charityId=${charity.id}`}
                className="dh-button w-full bg-[var(--dh-sage)] text-zinc-900 sm:w-auto"
              >
                Choose this cause
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
