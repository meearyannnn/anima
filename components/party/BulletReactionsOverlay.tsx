"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useKuroSync } from "@/lib/store/useKuroSync";

export function BulletReactionsOverlay() {
  const { bulletReactions } = useKuroSync();

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden z-30 select-none"
    >
      <AnimatePresence>
        {bulletReactions.map((item) => (
          <motion.div
            key={item.id}
            initial={{ x: "105vw", opacity: 0 }}
            animate={{
              x: "-10vw",
              opacity: [0, 1, 1, 0.8, 0],
            }}
            transition={{
              duration: item.speedDuration,
              ease: "linear",
            }}
            style={{
              top: `${item.topPercent}%`,
            }}
            className="absolute whitespace-nowrap flex items-center gap-2 py-1 px-3 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 shadow-lg text-white"
          >
            <span className="text-2xl drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
              {item.emoji}
            </span>
            <span className="text-xs font-semibold text-kuro-lavender/90 drop-shadow-md">
              {item.senderName}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
