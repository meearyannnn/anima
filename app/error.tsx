"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md bg-kuro-surface/80 border border-kuro-border rounded-2xl p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-kuro-text-dim text-sm mb-6 leading-relaxed">
          An unexpected error occurred while loading this page. Our stream servers might be experiencing temporary turbulence.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-kuro-accent text-white font-medium text-sm hover:bg-purple-600 transition-all shadow-glow-sm"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-kuro-border text-kuro-text hover:text-white hover:bg-white/10 text-sm font-medium transition-all"
          >
            <Home size={16} />
            Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
