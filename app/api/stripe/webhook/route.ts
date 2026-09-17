import Stripe from "stripe";

import { stripe } from "@/lib/stripe/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Stripe amounts are expressed in the currency's minor unit (paise for INR),
// while application monetary columns and UI formatting use whole rupees.
function fromStripeMinorUnit(amount: number | null | undefined) {
  return Math.round((amount ?? 0) / 100);
}

type Metadata = Record<string, string>;

function asMetadata(value: Stripe.Metadata | null | undefined): Metadata {
  return value ? { ...value } : {};
}

function asIsoDate(unixSeconds: number | null | undefined) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function subscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];

  return {
    current_period_start: asIsoDate(item?.current_period_start),
    current_period_end: asIsoDate(item?.current_period_end),
  };
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  metadataOverride: Metadata = {},
) {
  const metadata = {
    ...asMetadata(subscription.metadata),
    ...metadataOverride,
  };
  const subscriptionId = subscription.id;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, plan_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const userId = metadata.user_id ?? existing?.user_id;

  if (!userId) {
    throw new Error(`Stripe subscription ${subscriptionId} has no user_id metadata.`);
  }

  const period = subscriptionPeriod(subscription);
  const row = {
    user_id: userId,
    plan_id: metadata.plan_id ?? existing?.plan_id ?? null,
    stripe_customer_id: stripeId(subscription.customer),
    stripe_subscription_id: subscriptionId,
    status: subscription.status,
    ...period,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: asIsoDate(subscription.canceled_at),
  };

  const { data: saved, error: saveError } = await supabaseAdmin
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" })
    .select("id, user_id")
    .single();

  if (saveError || !saved) {
    throw saveError ?? new Error("Unable to save Stripe subscription.");
  }

  return { ...saved, metadata };
}

async function recordInvoicePayment(
  invoice: Stripe.Invoice,
  status: "paid" | "failed",
) {
  const subscriptionId = stripeId(
    invoice.parent?.subscription_details?.subscription,
  );

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const syncedSubscription = await syncSubscription(subscription);
  const invoiceMetadata = asMetadata(invoice.metadata);
  const metadata = {
    ...syncedSubscription.metadata,
    ...invoiceMetadata,
  };

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("subscription_payments")
    .upsert(
      {
        user_id: syncedSubscription.user_id,
        subscription_id: syncedSubscription.id,
        stripe_invoice_id: invoice.id,
        amount: fromStripeMinorUnit(invoice.amount_paid),
        currency: invoice.currency,
        status,
        paid_at: status === "paid" ? asIsoDate(invoice.status_transitions.paid_at) : null,
      },
      { onConflict: "stripe_invoice_id" },
    )
    .select("id")
    .single();

  if (paymentError || !payment) {
    throw paymentError ?? new Error("Unable to save Stripe payment.");
  }

  if (status !== "paid") {
    return;
  }

  const charityId = metadata.charity_id;
  const contributionPercent = Number(metadata.contribution_percent);

  if (
    !charityId ||
    !Number.isFinite(contributionPercent) ||
    contributionPercent < 10 ||
    contributionPercent > 100
  ) {
    throw new Error(`Stripe invoice ${invoice.id} has incomplete charity metadata.`);
  }

  const { data: charity, error: charityError } = await supabaseAdmin
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .maybeSingle();

  if (charityError || !charity) {
    throw charityError ?? new Error(`Charity ${charityId} was not found.`);
  }

  const { data: existingContribution, error: contributionLookupError } =
    await supabaseAdmin
      .from("charity_contributions")
      .select("id")
      .eq("subscription_payment_id", payment.id)
      .maybeSingle();

  if (contributionLookupError) {
    throw contributionLookupError;
  }

  if (existingContribution) {
    return;
  }

  const subscriptionAmount = fromStripeMinorUnit(invoice.amount_paid);
  const contributionAmount = Math.round(
    (subscriptionAmount * contributionPercent) / 100,
  );

  const { error: contributionError } = await supabaseAdmin
    .from("charity_contributions")
    .insert({
      user_id: syncedSubscription.user_id,
      charity_id: charity.id,
      subscription_payment_id: payment.id,
      subscription_amount: subscriptionAmount,
      contribution_percent: contributionPercent,
      contribution_amount: contributionAmount,
      period_start: asIsoDate(invoice.period_start),
      period_end: asIsoDate(invoice.period_end),
    });

  if (contributionError) {
    throw contributionError;
  }
}

async function recordDonation(
  session: Stripe.Checkout.Session,
  status: "pending" | "paid" | "failed",
) {
  const metadata = asMetadata(session.metadata);
  const userId = metadata.user_id;
  const charityId = metadata.charity_id;

  if (metadata.donation_type !== "charity_donation" || !userId || !charityId) {
    throw new Error(`Stripe donation session ${session.id} has incomplete metadata.`);
  }

  const { data: charity, error: charityError } = await supabaseAdmin
    .from("charities")
    .select("id")
    .eq("id", charityId)
    .maybeSingle();

  if (charityError || !charity) {
    throw charityError ?? new Error(`Charity ${charityId} was not found.`);
  }

  const { error } = await supabaseAdmin
    .from("charity_donations")
    .upsert(
      {
        user_id: userId,
        charity_id: charity.id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: stripeId(session.payment_intent),
        amount: fromStripeMinorUnit(session.amount_total),
        currency: session.currency ?? "inr",
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      },
      { onConflict: "stripe_checkout_session_id" },
    );

  if (error) {
    throw error;
  }
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        session.mode === "payment" &&
        asMetadata(session.metadata).donation_type === "charity_donation"
      ) {
        await recordDonation(
          session,
          session.payment_status === "paid" ? "paid" : "pending",
        );
        return;
      }

      const subscriptionId = stripeId(session.subscription);

      if (session.mode !== "subscription" || !subscriptionId) {
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription, asMetadata(session.metadata));
      return;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (asMetadata(session.metadata).donation_type !== "charity_donation") {
        return;
      }
      await recordDonation(session, "paid");
      return;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (asMetadata(session.metadata).donation_type !== "charity_donation") {
        return;
      }
      await recordDonation(session, "failed");
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object as Stripe.Subscription);
      return;

    case "invoice.paid":
      await recordInvoicePayment(event.data.object as Stripe.Invoice, "paid");
      return;

    case "invoice.payment_failed":
      await recordInvoicePayment(event.data.object as Stripe.Invoice, "failed");
      return;

    default:
      return;
  }
}

export async function POST(request: Request) {
  // Read configuration only when the webhook receives an event. This keeps
  // route import/build safe without making verification optional at runtime.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return Response.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch {
    return Response.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    await handleEvent(event);
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed:`, error);
    return Response.json(
      { error: "Unable to process Stripe event." },
      { status: 500 },
    );
  }

  return Response.json({ received: true });
}
