import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe/stripe";
import { createClient } from "@/lib/supabase/server";

const MIN_DONATION_RUPEES = 1;
const MAX_DONATION_RUPEES = 1_000_000;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const charityId = String(formData.get("charityId") ?? "").trim();
    const amount = Number(String(formData.get("amount") ?? "").trim());

    if (
      !charityId ||
      !Number.isSafeInteger(amount) ||
      amount < MIN_DONATION_RUPEES ||
      amount > MAX_DONATION_RUPEES
    ) {
      return NextResponse.json(
        { error: "Enter a valid donation amount." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?next=/charities/${encodeURIComponent(charityId)}/donate`, request.url),
        303,
      );
    }

    const { data: charity, error: charityError } = await supabase
      .from("charities")
      .select("id, name")
      .eq("id", charityId)
      .eq("is_active", true)
      .maybeSingle();

    if (charityError || !charity) {
      return NextResponse.json(
        { error: "Selected charity is not available." },
        { status: 400 },
      );
    }

    // Keep Stripe return URLs on the configured first-party origin. The
    // request Origin header is client-controlled.
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";
    const metadata = {
      donation_type: "charity_donation",
      user_id: user.id,
      charity_id: charity.id,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Donation to ${charity.name}`,
              description: "A one-time independent charity donation.",
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${origin}/charities/${charity.id}/donate?success=true`,
      cancel_url: `${origin}/charities/${charity.id}/donate?canceled=true`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create donation checkout session." },
        { status: 500 },
      );
    }

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Stripe donation checkout error:", error);
    return NextResponse.json(
      { error: "Unable to start donation checkout." },
      { status: 500 },
    );
  }
}
