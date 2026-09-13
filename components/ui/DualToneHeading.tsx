import React from "react";
import { splitDualToneTitle, cn } from "@/lib/utils";

interface DualToneHeadingProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "span";
}

export function DualToneHeading({
  text,
  className,
  as: Tag = "h1",
}: DualToneHeadingProps) {
  const { first, second } = splitDualToneTitle(text);

  return (
    <Tag className={cn("font-display tracking-tight font-black", className)}>
      <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">{first}</span>
      {second && (
        <span className="ml-2 sm:ml-3 text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 via-[#ff2a85] to-pink-300 drop-shadow-[0_0_30px_rgba(255,42,133,0.55)]">
          {second}
        </span>
      )}
    </Tag>
  );
}
