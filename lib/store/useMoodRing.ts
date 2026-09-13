import { create } from "zustand";

export interface MoodColors {
  name: string;
  primary: string; // Hex or rgba for main radial glow
  secondary: string; // Hex or rgba for ambient rim glow
  tertiary: string; // Deep undertone
}

export const MOOD_PALETTES: Record<string, MoodColors> = {
  default: {
    name: "Cyber Kuro",
    primary: "rgba(255, 42, 133, 0.22)", // Cyber Magenta
    secondary: "rgba(139, 92, 246, 0.18)", // Electric Purple
    tertiary: "rgba(0, 245, 255, 0.08)", // Neon Cyan
  },
  action: {
    name: "Blazing Fury",
    primary: "rgba(255, 69, 0, 0.24)", // Blaze Orange
    secondary: "rgba(255, 42, 133, 0.20)", // Magenta
    tertiary: "rgba(234, 179, 8, 0.10)", // Golden Spark
  },
  horror: {
    name: "Abyssal Shadow",
    primary: "rgba(225, 29, 72, 0.24)", // Blood Crimson
    secondary: "rgba(76, 29, 149, 0.26)", // Deep Shadow Indigo
    tertiary: "rgba(15, 23, 42, 0.30)", // Pure Abyssal
  },
  scifi: {
    name: "Cyber Nexus",
    primary: "rgba(6, 182, 212, 0.24)", // Electric Cyan
    secondary: "rgba(59, 130, 246, 0.20)", // Deep Cobalt
    tertiary: "rgba(147, 51, 234, 0.12)", // Matrix Purple
  },
  romance: {
    name: "Sakura Dusk",
    primary: "rgba(244, 63, 94, 0.24)", // Sakura Rose
    secondary: "rgba(245, 158, 11, 0.18)", // Warm Sunset Gold
    tertiary: "rgba(217, 70, 239, 0.12)", // Blossom Fuchsia
  },
  fantasy: {
    name: "Emerald Aurora",
    primary: "rgba(16, 185, 129, 0.24)", // Mystic Emerald
    secondary: "rgba(139, 92, 246, 0.20)", // Arcane Violet
    tertiary: "rgba(14, 165, 233, 0.12)", // Starlight Cyan
  },
  comedy: {
    name: "Electric Joy",
    primary: "rgba(234, 179, 8, 0.24)", // Sunburst Yellow
    secondary: "rgba(236, 72, 153, 0.20)", // Neon Pink
    tertiary: "rgba(249, 115, 22, 0.12)", // Citrus Punch
  },
};

export function getPaletteForGenres(genres?: string[] | null): MoodColors {
  if (!genres || genres.length === 0) return MOOD_PALETTES.default;

  const normalized = genres.map((g) => g.toLowerCase());

  if (normalized.some((g) => g.includes("horror") || g.includes("psychological") || g.includes("thriller"))) {
    return MOOD_PALETTES.horror;
  }
  if (normalized.some((g) => g.includes("sci-fi") || g.includes("mecha"))) {
    return MOOD_PALETTES.scifi;
  }
  if (normalized.some((g) => g.includes("romance") || g.includes("slice of life") || g.includes("drama"))) {
    return MOOD_PALETTES.romance;
  }
  if (normalized.some((g) => g.includes("action") || g.includes("martial arts") || g.includes("super power"))) {
    return MOOD_PALETTES.action;
  }
  if (normalized.some((g) => g.includes("fantasy") || g.includes("magic") || g.includes("supernatural") || g.includes("adventure"))) {
    return MOOD_PALETTES.fantasy;
  }
  if (normalized.some((g) => g.includes("comedy") || g.includes("sports"))) {
    return MOOD_PALETTES.comedy;
  }

  return MOOD_PALETTES.default;
}

interface MoodRingState {
  currentMood: MoodColors;
  isHoveringPreview: boolean;
  activeSourceTitle: string | null;
  isEnabled: boolean;
  setMoodFromGenres: (genres?: string[] | null, title?: string) => void;
  previewMoodFromGenres: (genres?: string[] | null, title?: string) => void;
  clearPreview: () => void;
  resetToDefault: () => void;
  toggleEnabled: () => void;
}

export const useMoodRing = create<MoodRingState>((set, get) => ({
  currentMood: MOOD_PALETTES.default,
  isHoveringPreview: false,
  activeSourceTitle: null,
  isEnabled: true,

  setMoodFromGenres: (genres, title) => {
    if (!get().isEnabled) return;
    const mood = getPaletteForGenres(genres);
    set({ currentMood: mood, activeSourceTitle: title || null, isHoveringPreview: false });
  },

  previewMoodFromGenres: (genres, title) => {
    if (!get().isEnabled) return;
    const mood = getPaletteForGenres(genres);
    set({ currentMood: mood, activeSourceTitle: title || null, isHoveringPreview: true });
  },

  clearPreview: () => {
    if (get().isHoveringPreview) {
      set({ currentMood: MOOD_PALETTES.default, isHoveringPreview: false, activeSourceTitle: null });
    }
  },

  resetToDefault: () => {
    set({ currentMood: MOOD_PALETTES.default, isHoveringPreview: false, activeSourceTitle: null });
  },

  toggleEnabled: () => {
    set((state) => ({ isEnabled: !state.isEnabled }));
  },
}));
