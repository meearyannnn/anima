"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMoodRing } from "@/lib/store/useMoodRing";

/**
 * AmbientGlow — replaces the old MoodRingGlow.
 * Single subtle radial accent that shifts hue based on the current mood.
 * No mouse tracking, no per-frame updates — just a smooth CSS transition.
 */
export function MoodRingGlow() {
  const [mounted, setMounted] = useState(false);
  const { currentMood, isEnabled } = useMoodRing();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isEnabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* Single top-right ambient orb */}
      <motion.div
        className="absolute -top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-50 mix-blend-screen"
        animate={{
          background: `radial-gradient(circle, ${currentMood.primary} 0%, transparent 70%)`,
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
    </div>
  );
}
