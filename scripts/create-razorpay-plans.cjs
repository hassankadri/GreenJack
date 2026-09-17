/* eslint-disable @typescript-eslint/no-require-imports */

const { loadEnvConfig } = require("@next/env");
const Razorpay = require("razorpay");

loadEnvConfig(process.cwd());

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error(
    "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from .env.local",
  );
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

async function createPlan({
  name,
  period,
  amount,
}) {
  const plan = await razorpay.plans.create({
    period,
    interval: 1,
    item: {
      name,
      amount,
      currency: "INR",
      description: `GreenJack ${name} membership`,
    },
    notes: {
      project: "digital-heroes",
      environment: "test",
    },
  });

  console.log(`${name} plan created:`);
  console.log(plan.id);
  console.log("");
}

async function main() {
  await createPlan({
    name: "Monthly",
    period: "monthly",
    amount: 99900,
  });

  await createPlan({
    name: "Yearly",
    period: "yearly",
    amount: 999900,
  });
}

main().catch((error) => {
  console.error("Failed to create Razorpay plans:");
  console.error(error);
  process.exit(1);
});
