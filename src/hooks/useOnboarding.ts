"use client";
import { useEffect, useState } from "react";

export const onboardingSteps = [
  "welcome",
  "costs",
  "product",
  "price",
  "simulation",
  "result",
] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];
const storageKey = "precifica_onboarding_v1";

export function readOnboarding(
  raw: string | null,
): { step: OnboardingStep; completed: boolean } | null {
  try {
    const value = JSON.parse(raw ?? "null");
    if (
      value &&
      onboardingSteps.includes(value.step) &&
      typeof value.completed === "boolean"
    ) {
      return { step: value.step, completed: value.completed };
    }
  } catch {
    /* Invalid preferences can be replaced without touching business data. */
  }
  return null;
}

export function useOnboarding() {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [active, setActive] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    try {
      const saved = readOnboarding(localStorage.getItem(storageKey));
      if (saved) {
        setStep(saved.step);
        setCompleted(saved.completed);
      } else setActive(true);
    } catch {
      setActive(true);
      setStorageAvailable(false);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ step, completed }));
    } catch {
      setStorageAvailable(false);
    }
  }, [step, completed, ready]);

  return {
    step,
    active,
    completed,
    ready,
    storageAvailable,
    go: (next: OnboardingStep) => {
      setStep(next);
      setActive(true);
    },
    start: () => {
      if (completed) {
        setStep("welcome");
        setCompleted(false);
      }
      setActive(true);
    },
    pause: () => setActive(false),
    finish: () => {
      setCompleted(true);
      setActive(false);
    },
  };
}
