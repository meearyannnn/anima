"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md"
      >
        <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-kuro-accent to-purple-400 select-none">
          404
        </span>
        <h1 className="text-2xl font-bold text-white mt-4 mb-2">Episode or Page Not Found</h1>
        <p className="text-kuro-text-dim text-sm mb-8 leading-relaxed">
          The page you are looking for may have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-kuro-accent text-white font-medium text-sm hover:bg-purple-600 shadow-glow transition-all"
          >
            <Home size={18} />
            Back to Home
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-kuro-surface border border-kuro-border text-white font-medium text-sm hover:bg-white/10 transition-all"
          >
            <Search size={18} />
            Browse Anime
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
