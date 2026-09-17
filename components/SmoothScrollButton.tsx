"use client";

import { ChevronDown } from "lucide-react";

export default function SmoothScrollButton() {
  function handleClick() {
    const target = document.getElementById("how-it-works");

    if (!target) {
      return;
    }

    const startPosition = window.scrollY;
    const targetPosition =
      target.getBoundingClientRect().top + window.scrollY - 20;

    const distance = targetPosition - startPosition;
    const duration = 1200;
    let startTime: number | null = null;

    function easeInOutCubic(progress: number) {
      return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }

    function animate(currentTime: number) {
      if (startTime === null) {
        startTime = currentTime;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      window.scrollTo(
        0,
        startPosition + distance * easedProgress,
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to learn how GreenJack works"
      className="group flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/70 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white active:scale-95"
    >
      <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
    </button>
  );
}
