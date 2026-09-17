import { Check, Heart, X } from "lucide-react";
import { notFound } from "next/navigation";

import BackButton from "../../../../components/BackButton";
import DonationForm from "../../../../components/DonationForm";
import { createClient } from "@/lib/supabase/server";

type DonationPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
};

export default async function DonationPage({
  params,
  searchParams,
}: DonationPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: charity, error } = await supabase
    .from("charities")
    .select("id, name, description")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !charity) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--dh-ivory)] text-[var(--dh-ink)]">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <header className="border-b border-black/10 pb-5">
          <BackButton fallback={`/charities/${charity.id}`} label="Back to charity" />
        </header>

        <section className="py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dh-sage-soft)]">
            <Heart className="h-6 w-6" />
          </div>
          <p className="dh-eyebrow mt-8 text-zinc-500">Independent donation</p>
          <h1 className="dh-display mt-4 break-words text-6xl sm:text-7xl">Support {charity.name}</h1>
          <p className="dh-body mt-6 max-w-2xl break-words text-lg">{charity.description}</p>

          {query.success === "true" && (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              <Check className="h-5 w-5" />
              Thank you. Your donation is being confirmed by Stripe.
            </div>
          )}
          {query.canceled === "true" && (
            <div className="mt-8 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              <X className="h-5 w-5" />
              Donation checkout was canceled. No donation was recorded.
            </div>
          )}

          <div className="dh-panel mt-8 p-7 sm:p-9">
            <h2 className="text-2xl font-semibold">Choose your donation</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This one-time donation is separate from GreenJack membership and gameplay contributions.
            </p>
            <DonationForm charityId={charity.id} />
          </div>
        </section>
      </div>
    </main>
  );
}
