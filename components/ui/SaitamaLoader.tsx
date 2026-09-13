"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface SaitamaLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function SaitamaLoader({
  size = "md",
  text,
  className,
}: SaitamaLoaderProps) {
  const dimensions = {
    sm: { width: 36, height: 42, text: "text-[10px]" },
    md: { width: 64, height: 75, text: "text-xs" },
    lg: { width: 96, height: 112, text: "text-sm" },
  }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-4 select-none pointer-events-none",
        className
      )}
      role="status"
      aria-label="Loading content"
    >
      <div className="relative flex items-center justify-center">
        {/* Subtle breathing glow behind Saitama */}
        <div className="absolute inset-0 rounded-full bg-magenta-500/15 blur-xl animate-pulse" />

        {/* Floating animated Saitama face */}
        <div className="relative animate-bounce [animation-duration:1.6s]">
          <Image
            src="/loader.png"
            alt="Loading..."
            width={dimensions.width}
            height={dimensions.height}
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            priority={size === "lg"}
          />
        </div>
      </div>

      {text && (
        <span
          className={cn(
            "font-mono font-bold tracking-wider text-white/50 mt-3 animate-pulse uppercase",
            dimensions.text
          )}
        >
          {text}
        </span>
      )}
    </div>
  );
}
