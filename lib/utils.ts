import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null | undefined): string {
  if (!score) return "N/A";
  return (score / 10).toFixed(1);
}

export function formatEpisodeCount(count: number | null | undefined): string {
  if (!count) return "? eps";
  return `${count} eps`;
}

export function getAnimeTitle(
  title: { romaji: string; english: string | null; native: string } | undefined
): string {
  if (!title) return "Unknown";
  return title.english || title.romaji || title.native;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Splits a title into a dual-tone aesthetic font combo (50% Crisp White, 50% Shiny Magenta)
 */
export function splitDualToneTitle(text: string): { first: string; second: string } {
  if (!text) return { first: "", second: "" };

  const trimmed = text.trim();

  // If title has a colon (e.g. "BLEACH: Thousand-Year Blood War")
  if (trimmed.includes(":")) {
    const colonIdx = trimmed.indexOf(":");
    return {
      first: trimmed.slice(0, colonIdx + 1),
      second: trimmed.slice(colonIdx + 1).trim(),
    };
  }

  // If title has a dash separator (e.g. "Attack on Titan - Final Season")
  if (trimmed.includes(" - ")) {
    const dashIdx = trimmed.indexOf(" - ");
    return {
      first: trimmed.slice(0, dashIdx + 2),
      second: trimmed.slice(dashIdx + 3).trim(),
    };
  }

  // Otherwise split words roughly in half
  const words = trimmed.split(/\s+/);
  if (words.length <= 1) {
    return { first: trimmed, second: "" };
  }

  const mid = Math.ceil(words.length / 2);
  return {
    first: words.slice(0, mid).join(" "),
    second: words.slice(mid).join(" "),
  };
}
