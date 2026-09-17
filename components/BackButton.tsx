"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallback?: string;
  label?: string;
  className?: string;
};

export default function BackButton({
  fallback = "/",
  label = "Back",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  function handleBack() {
    const hasSameOriginReferrer =
      document.referrer.startsWith(window.location.origin);

    if (window.history.length > 1 && hasSameOriginReferrer) {
      router.back();
      return;
    }

    router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`group inline-flex min-h-11 items-center gap-2 rounded-full py-2 text-sm text-zinc-500 transition hover:text-zinc-900 ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4 transition duration-300 group-hover:-translate-x-1" />
      {label}
    </button>
  );
}
