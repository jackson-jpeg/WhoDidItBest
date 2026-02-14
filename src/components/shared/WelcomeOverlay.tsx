"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "wdib_welcomed";

const steps = [
  {
    number: "I",
    title: "Pick Your Side",
    description: "Tap to vote on matchups across music, movies, food, and more.",
  },
  {
    number: "II",
    title: "See the Verdict",
    description: "Watch the results reveal in real time. Are you with the crowd — or against it?",
  },
  {
    number: "III",
    title: "Keep Going",
    description: "Build your streak, unlock achievements, and make your case in the comments.",
  },
];

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-cream border-2 border-arena-red/30 w-full max-w-md shadow-card-hover"
          >
            {/* Header */}
            <div className="border-b border-ink/10 px-6 pt-6 pb-4 text-center">
              <p className="font-ui text-[10px] uppercase tracking-[0.2em] text-arena-red font-bold mb-2">
                Welcome to
              </p>
              <h2 className="font-headline text-2xl md:text-3xl font-black tracking-tight">
                The Arena
              </h2>
              <p className="text-ink-muted text-sm mt-1">
                Where opinions become verdicts.
              </p>
            </div>

            {/* Step content */}
            <div className="px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <span className="font-headline text-5xl font-black text-arena-red/20">
                    {steps[step].number}
                  </span>
                  <h3 className="font-headline text-xl font-bold mt-2 mb-2">
                    {steps[step].title}
                  </h3>
                  <p className="text-ink-muted text-sm leading-relaxed">
                    {steps[step].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Step indicators */}
              <div className="flex justify-center gap-2 mt-5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 transition-all duration-300 ${
                      i === step
                        ? "w-6 bg-arena-red"
                        : i < step
                        ? "w-3 bg-arena-red/40"
                        : "w-3 bg-ink/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-ink/10 px-6 py-4 flex items-center justify-between">
              <button
                onClick={dismiss}
                className="font-ui text-xs uppercase tracking-widest text-ink-light hover:text-ink transition-colors cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={next}
                className="font-ui text-sm uppercase tracking-wide bg-arena-red text-cream px-6 py-2.5 hover:bg-arena-red/90 transition-colors cursor-pointer"
              >
                {step < steps.length - 1 ? "Next" : "Enter the Arena"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
