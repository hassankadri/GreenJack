"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

const PRESET_AMOUNTS = [100, 500, 1000];

export default function DonationForm({ charityId }: { charityId: string }) {
  const [amount, setAmount] = useState("500");

  return (
    <form action="/api/donations/checkout" method="POST" className="mt-7">
      <input type="hidden" name="charityId" value={charityId} />

      <div className="grid grid-cols-3 gap-3">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(String(preset))}
            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
              amount === String(preset)
                ? "border-[var(--dh-charcoal)] bg-[var(--dh-charcoal)] text-white"
                : "border-black/10 bg-white hover:border-black/30"
            }`}
          >
            ₹{preset.toLocaleString("en-IN")}
          </button>
        ))}
      </div>

      <label className="mt-5 block text-sm font-semibold" htmlFor="donation-amount">
        Or enter an amount (₹)
      </label>
      <input
        id="donation-amount"
        name="amount"
        type="number"
        min="1"
        max="1000000"
        step="1"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        required
        className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-black/40"
      />

      <button type="submit" className="dh-button dh-button-primary mt-5 w-full">
        Continue to secure checkout
        <ArrowUpRight className="h-4 w-4" />
      </button>
      <p className="mt-3 text-center text-xs text-zinc-500">
        You will be redirected to Stripe&apos;s secure checkout.
      </p>
    </form>
  );
}
