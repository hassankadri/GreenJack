import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/stripe";

async function createCheckout(
  request: Request,
  planId: string,
  submittedCharityId?: string,
  submittedContributionPercent?: string,
) {
  if (!planId) {
    return NextResponse.json(
      { error: "Subscription plan is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in." },
      { status: 401 },
    );
  }

  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("id, name, interval, price_amount, currency")
    .eq("id", planId)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    return NextResponse.json(
      { error: "Subscription plan not found." },
      { status: 404 },
    );
  }

  let charityPreference;

  if (submittedCharityId !== undefined || submittedContributionPercent !== undefined) {
    const contributionPercent = Number(submittedContributionPercent ?? "");

    if (
      !submittedCharityId ||
      !Number.isFinite(contributionPercent) ||
      contributionPercent < 10 ||
      contributionPercent > 100
    ) {
      return NextResponse.json(
        { error: "Choose a charity and contribution between 10% and 100%." },
        { status: 400 },
      );
    }

    const { data: charity, error: charityLookupError } = await supabase
      .from("charities")
      .select("id")
      .eq("id", submittedCharityId)
      .eq("is_active", true)
      .maybeSingle();

    if (charityLookupError || !charity) {
      return NextResponse.json(
        { error: "Selected charity is not available." },
        { status: 400 },
      );
    }

    const { data: savedPreference, error: savePreferenceError } =
      await supabase
        .from("charity_preferences")
        .upsert({
          user_id: user.id,
          charity_id: charity.id,
          contribution_percent: contributionPercent,
        })
        .select("charity_id, contribution_percent")
        .single();

    if (savePreferenceError || !savedPreference) {
      return NextResponse.json(
        { error: "Unable to save your charity preference." },
        { status: 500 },
      );
    }

    charityPreference = savedPreference;
  } else {
    const { data: existingPreference, error: charityError } =
      await supabase
        .from("charity_preferences")
        .select("charity_id, contribution_percent")
        .eq("user_id", user.id)
        .maybeSingle();

    if (charityError) {
      return NextResponse.json(
        { error: "Unable to load your charity preference." },
        { status: 500 },
      );
    }

    charityPreference = existingPreference;
  }

  if (!charityPreference) {
    return NextResponse.json(
      { error: "Please select a charity first." },
      { status: 400 },
    );
  }

  // Use the configured first-party origin for Stripe return URLs. The
  // request Origin header is client-controlled and must not determine where
  // a completed checkout redirects.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const metadata = {
    user_id: user.id,
    plan_id: plan.id,
    charity_id: charityPreference.charity_id,
    contribution_percent: String(
      charityPreference.contribution_percent,
    ),
  };

  const checkoutSession =
    await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,

      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),

            product_data: {
              name: `GreenJack ${plan.name} Membership`,
              description:
                "Membership access, monthly draws and charitable impact.",
            },

            recurring: {
              interval:
                plan.interval === "yearly"
                  ? "year"
                  : "month",
            },

            unit_amount: Math.round(
              Number(plan.price_amount) * 100,
            ),
          },

          quantity: 1,
        },
      ],

      metadata,
      subscription_data: {
        metadata,
      },

      success_url: `${origin}/subscribe?success=payment`,
      cancel_url: `${origin}/subscribe?canceled=true`,
    });

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(
    checkoutSession.url,
    303,
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const planId = url.searchParams.get("planId") ?? "";

  try {
    return await createCheckout(request, planId);
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Unable to start checkout." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const planId = String(
      formData.get("planId") ?? "",
    ).trim();
    const charityId = String(
      formData.get("charityId") ?? "",
    ).trim();
    const contributionPercent = String(
      formData.get("contributionPercent") ?? "",
    ).trim();

    return await createCheckout(
      request,
      planId,
      charityId,
      contributionPercent,
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Unable to start checkout." },
      { status: 500 },
    );
  }
}
