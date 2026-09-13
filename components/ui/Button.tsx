"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "relative inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-magenta-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-magenta-500 text-white hover:bg-magenta-400 active:scale-95 shadow-[0_0_20px_rgba(255,42,133,0.45)] hover:shadow-[0_0_30px_rgba(255,42,133,0.7)] font-black",
    secondary:
      "bg-kuro-surface text-white border border-white/10 hover:border-magenta-500/50 hover:bg-white/5 active:scale-95",
    ghost:
      "text-white/70 hover:text-white hover:bg-white/5 active:scale-95",
    danger:
      "bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-8 text-base",
    icon: "h-10 w-10 p-0",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.95 }}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...(props as object)}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : null}
      {children}
    </motion.button>
  );
}
