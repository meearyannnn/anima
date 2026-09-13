"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMoodRing } from "@/lib/store/useMoodRing";

export function MoodRingGlow() {
  const [mounted, setMounted] = useState(false);
  const { currentMood, isEnabled, isHoveringPreview, activeSourceTitle } = useMoodRing();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isEnabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-opacity duration-1000"
    >
      {/* Primary Atmospheric Orb (Top Right / Center) */}
      <motion.div
        className="absolute -top-[15%] right-[-10%] sm:right-[5%] w-[600px] h-[600px] sm:w-[850px] sm:h-[850px] rounded-full blur-[140px] opacity-80 mix-blend-screen"
        animate={{
          background: `radial-gradient(circle, ${currentMood.primary} 0%, transparent 70%)`,
          scale: isHoveringPreview ? [1, 1.06, 1.03] : [1, 1.03, 1],
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
        }}
      />

      {/* Secondary Atmospheric Orb (Mid Left) */}
      <motion.div
        className="absolute top-[28%] -left-[15%] sm:-left-[5%] w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full blur-[160px] opacity-70 mix-blend-screen"
        animate={{
          background: `radial-gradient(circle, ${currentMood.secondary} 0%, transparent 75%)`,
        }}
        transition={{
          duration: 1.4,
          ease: "easeInOut",
        }}
      />

      {/* Deep Tertiary Rim Glow (Bottom Center) */}
      <motion.div
        className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] sm:w-[800px] sm:h-[800px] rounded-full blur-[180px] opacity-50 mix-blend-screen"
        animate={{
          background: `radial-gradient(circle, ${currentMood.tertiary} 0%, transparent 70%)`,
        }}
        transition={{
          duration: 1.6,
          ease: "easeInOut",
        }}
      />

      {/* Subtle floating mood badge when previewing on hover */}
      <AnimatePresence>
        {isHoveringPreview && activeSourceTitle && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-40 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-kuro-card/85 backdrop-blur-md border border-white/10 text-xs text-white/80 shadow-2xl pointer-events-none"
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: currentMood.primary }}
            />
            <span className="font-medium text-white/90 truncate max-w-[180px]">
              {activeSourceTitle}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-kuro-lavender/60">
              [{currentMood.name}]
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
