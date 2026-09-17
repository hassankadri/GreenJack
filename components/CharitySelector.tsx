"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Heart } from "lucide-react";

type Charity = {
  id: string;
  name: string;
  description: string;
};

type CharitySelectorProps = {
  charities: Charity[];
  initialCharityId: string;
  initialContributionPercent: number;
};

export default function CharitySelector({
  charities,
  initialCharityId,
  initialContributionPercent,
}: CharitySelectorProps) {
  const [selectedCharityId, setSelectedCharityId] =
    useState(initialCharityId);

  const selectedCharity =
    charities.find(
      (charity) => charity.id === selectedCharityId,
    ) ?? null;

  return (
    <>
      {selectedCharity && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[var(--dh-sage-soft)] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Selected cause
            </p>

            <p className="mt-1 break-words text-lg font-semibold text-zinc-900">
              {selectedCharity.name}
            </p>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--dh-sage)]">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {charities.map((charity) => {
          const selected =
            selectedCharityId === charity.id;

          return (
            <label
              key={charity.id}
              className={`group cursor-pointer rounded-2xl border bg-[var(--dh-paper)] p-5 transition duration-300 ${
                selected
                  ? "border-zinc-900 shadow-md"
                  : "border-zinc-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm"
              }`}
            >
              <div className="flex gap-4">
                <input
                  type="radio"
                  name="charityId"
                  value={charity.id}
                  checked={selected}
                  onChange={() =>
                    setSelectedCharityId(charity.id)
                  }
                  required
                  className="mt-1 h-4 w-4"
                />

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-zinc-900">
                      {charity.name}
                    </p>

                    {selected && (
                      <Heart className="h-4 w-4 shrink-0 text-zinc-700" />
                    )}
                  </div>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {charity.description}
                  </p>

                  <Link
                    href={`/charities/${charity.id}`}
                    className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-full py-2 text-xs font-semibold text-zinc-700 underline underline-offset-4"
                  >
                    Learn more
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-8 max-w-sm">
        <label
          htmlFor="contributionPercent"
          className="text-sm font-medium"
        >
          Charity contribution
        </label>

        <div className="mt-2 flex items-center gap-3">
          <input
            id="contributionPercent"
            name="contributionPercent"
            type="number"
            min="10"
            max="100"
            step="1"
            defaultValue={initialContributionPercent}
            required
            className="w-32 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900"
          />

          <span className="text-sm text-zinc-500">
            10% minimum
          </span>
        </div>
      </div>
    </>
  );
}
