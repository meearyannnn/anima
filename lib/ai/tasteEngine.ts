import type { AniListMedia, MyListItem, WatchHistoryItem } from "@/lib/types";
import { VIBE_ARCHETYPES, type VibeArchetype } from "./vibePresets";

export interface GenreAffinity {
  genre: string;
  count: number;
  percentage: number;
}

export interface TasteProfile {
  topGenres: GenreAffinity[];
  personaTitle: string;
  personaSummary: string;
  totalWatched: number;
  totalSaved: number;
  topStudios: string[];
  avgRatingPreference: number;
}

export interface SmartRecommendation {
  anime: AniListMedia;
  matchScore: number;
  rationale: string;
  vibeTags: string[];
  breakdown: {
    animation: number;
    story: number;
    hype: number;
  };
}

/**
 * Analyzes watch history and vault items to construct a real-time Taste Genome profile.
 */
export function analyzeTasteProfile(
  history: WatchHistoryItem[],
  myList: MyListItem[]
): TasteProfile {
  const genreCounts: Record<string, number> = {};
  let totalGenreHits = 0;

  // Count from saved vault items (which contain genres)
  myList.forEach((item) => {
    if (item.genres && Array.isArray(item.genres)) {
      item.genres.forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 2; // vault items carry 2x intent weight
        totalGenreHits += 2;
      });
    }
  });

  // If vault is sparse, seed from common anime watch history titles heuristics
  history.forEach((h) => {
    const t = h.animeTitile.toLowerCase();
    if (t.includes("jujutsu") || t.includes("slayer") || t.includes("piece") || t.includes("bleach") || t.includes("naruto") || t.includes("leveling")) {
      genreCounts["Action"] = (genreCounts["Action"] || 0) + 1;
      genreCounts["Supernatural"] = (genreCounts["Supernatural"] || 0) + 1;
      totalGenreHits += 2;
    } else if (t.includes("death note") || t.includes("monster") || t.includes("geass") || t.includes("psycho")) {
      genreCounts["Psychological"] = (genreCounts["Psychological"] || 0) + 1;
      genreCounts["Mystery"] = (genreCounts["Mystery"] || 0) + 1;
      totalGenreHits += 2;
    } else if (t.includes("frieren") || t.includes("bocchi") || t.includes("camp") || t.includes("spy")) {
      genreCounts["Slice of Life"] = (genreCounts["Slice of Life"] || 0) + 1;
      genreCounts["Comedy"] = (genreCounts["Comedy"] || 0) + 1;
      totalGenreHits += 2;
    } else if (t.includes("edgerunners") || t.includes("ghost") || t.includes("vivy")) {
      genreCounts["Sci-Fi"] = (genreCounts["Sci-Fi"] || 0) + 1;
      genreCounts["Action"] = (genreCounts["Action"] || 0) + 1;
      totalGenreHits += 2;
    }
  });

  // Default fallback if brand new user
  if (totalGenreHits === 0) {
    genreCounts["Action"] = 5;
    genreCounts["Supernatural"] = 4;
    genreCounts["Fantasy"] = 3;
    genreCounts["Psychological"] = 3;
    totalGenreHits = 15;
  }

  const sortedGenres: GenreAffinity[] = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: Math.round((count / totalGenreHits) * 100),
    }));

  // Determine Persona Title & Summary
  const top1 = sortedGenres[0]?.genre || "Action";
  const top2 = sortedGenres[1]?.genre || "Fantasy";

  let personaTitle = "Curious Anime Voyager";
  let personaSummary = "You enjoy exploring fresh anime across varied worlds and animation styles.";

  if (top1 === "Psychological" || top2 === "Psychological" || top1 === "Mystery") {
    personaTitle = "Dark Mind Games Strategist";
    personaSummary = "You crave intellectual chess matches, complex anti-heroes, and morally grey twists.";
  } else if (top1 === "Action" && (top2 === "Supernatural" || top2 === "Fantasy")) {
    personaTitle = "High-Octane Battle Connoisseur";
    personaSummary = "You live for god-tier animation, sakuga impact frames, and escalating power systems.";
  } else if (top1 === "Sci-Fi" || top2 === "Sci-Fi") {
    personaTitle = "Cyberpunk Neo-Futurist";
    personaSummary = "Dystopian lore, neon-drenched technology, and existential cyberpunk thrill you.";
  } else if (top1 === "Slice of Life" || top1 === "Comedy") {
    personaTitle = "Aesthetic Healing Wanderer";
    personaSummary = "You seek comforting, heartwarming worlds with cozy banter and peaceful visual artistry.";
  } else if (top1 === "Drama" || top1 === "Romance") {
    personaTitle = "Bittersweet Emotion Connoisseur";
    personaSummary = "You appreciate poignant storytelling, resonant voice acting, and profound emotional depth.";
  }

  return {
    topGenres: sortedGenres,
    personaTitle,
    personaSummary,
    totalWatched: history.length,
    totalSaved: myList.length,
    topStudios: ["MAPPA", "Ufotable", "Bones", "Wit Studio", "A-1 Pictures"],
    avgRatingPreference: 85,
  };
}

/**
 * Parses user free-form natural language query into target vibes & keywords
 */
export function parseNaturalLanguageVibe(rawPrompt: string): {
  keywords: string[];
  targetGenres: string[];
  tone: string;
} {
  const p = rawPrompt.toLowerCase();
  const targetGenres: string[] = [];
  const keywords: string[] = [];
  let tone = "balanced";

  if (p.includes("dark") || p.includes("grim") || p.includes("horror") || p.includes("blood") || p.includes("ruthless")) {
    tone = "dark";
    keywords.push("dark", "mature");
    targetGenres.push("Horror", "Psychological");
  }
  if (p.includes("mind") || p.includes("strategy") || p.includes("genius") || p.includes("detective") || p.includes("twist")) {
    keywords.push("tactical", "mind games");
    targetGenres.push("Psychological", "Mystery");
  }
  if (p.includes("hype") || p.includes("action") || p.includes("fight") || p.includes("battle") || p.includes("animation")) {
    keywords.push("sakuga", "intense");
    targetGenres.push("Action", "Fantasy");
  }
  if (p.includes("cozy") || p.includes("relax") || p.includes("wholesome") || p.includes("chill") || p.includes("calm")) {
    tone = "cozy";
    keywords.push("wholesome", "relaxing");
    targetGenres.push("Slice of Life", "Comedy");
  }
  if (p.includes("sad") || p.includes("cry") || p.includes("tears") || p.includes("romance") || p.includes("emotional")) {
    tone = "emotional";
    keywords.push("tearjerker", "poignant");
    targetGenres.push("Drama", "Romance");
  }
  if (p.includes("cyber") || p.includes("sci-fi") || p.includes("future") || p.includes("robot") || p.includes("ai")) {
    keywords.push("cyberpunk", "futuristic");
    targetGenres.push("Sci-Fi");
  }
  if (p.includes("op") || p.includes("overpower") || p.includes("isekai") || p.includes("god")) {
    keywords.push("overpowered", "badass");
    targetGenres.push("Fantasy", "Action");
  }

  return { keywords, targetGenres, tone };
}

/**
 * Calculates a personalized match score (85 - 99%) and generates a contextual AI rationale.
 */
export function calculateSmartMatch(
  anime: AniListMedia,
  profile: TasteProfile,
  vibePrompt?: string,
  selectedArchetype?: VibeArchetype | null
): SmartRecommendation {
  let score = 84;
  const animeGenres = anime.genres || [];
  const studioName = anime.studios?.nodes?.[0]?.name || "";

  // 1. Genre synergy bonus
  profile.topGenres.forEach((g) => {
    if (animeGenres.includes(g.genre)) {
      score += Math.min(6, Math.round(g.percentage / 7));
    }
  });

  // 2. High rating baseline bonus
  if (anime.averageScore) {
    if (anime.averageScore >= 85) score += 4;
    else if (anime.averageScore >= 78) score += 2;
  }

  // 3. Studio reputation bonus
  if (["Ufotable", "MAPPA", "Bones", "Wit Studio", "CloverWorks", "Madhouse"].includes(studioName)) {
    score += 3;
  }

  // 4. Prompt relevance bonus
  if (vibePrompt && vibePrompt.trim().length > 0) {
    const parsed = parseNaturalLanguageVibe(vibePrompt);
    parsed.targetGenres.forEach((tg) => {
      if (animeGenres.includes(tg)) score += 3;
    });
  }

  // 5. Archetype synergy bonus
  if (selectedArchetype) {
    if (selectedArchetype.seedIds.includes(anime.id)) {
      score += 5;
    }
    selectedArchetype.genres.forEach((ag) => {
      if (animeGenres.includes(ag)) score += 2;
    });
  }

  // Clamp score between 87% and 99%
  const finalScore = Math.min(99, Math.max(87, score));

  // Determine sub-breakdown
  const animationRating = ["Ufotable", "MAPPA", "Bones"].includes(studioName) || animeGenres.includes("Action")
    ? 98
    : 92;
  const storyRating = animeGenres.includes("Psychological") || animeGenres.includes("Mystery") || animeGenres.includes("Drama")
    ? 97
    : 90;
  const hypeRating = animeGenres.includes("Action") || animeGenres.includes("Fantasy")
    ? 96
    : 88;

  // Generate dynamic contextual rationale
  const mainGenre = animeGenres[0] || "Anime";
  let rationale = `Matched with your taste profile for ${profile.personaTitle.toLowerCase()}.`;

  if (selectedArchetype) {
    rationale = `Curated for "${selectedArchetype.name}" — shares intense ${mainGenre.toLowerCase()} narrative beats and high engagement score.`;
  } else if (vibePrompt) {
    rationale = `Matches your vibe prompt "${vibePrompt.slice(0, 30)}..." with resonant ${mainGenre} elements and critically acclaimed execution.`;
  } else if (studioName) {
    rationale = `Produced by ${studioName}. Features exceptional ${mainGenre.toLowerCase()} pacing that seamlessly aligns with your vault habits.`;
  }

  // Generate relevant vibe tags
  const vibeTags: string[] = [];
  if (animeGenres.includes("Action")) vibeTags.push("#SakugaAction");
  if (animeGenres.includes("Psychological")) vibeTags.push("#MindGames");
  if (animeGenres.includes("Sci-Fi")) vibeTags.push("#Cyberpunk");
  if (animeGenres.includes("Drama")) vibeTags.push("#DeepLore");
  if (animeGenres.includes("Supernatural")) vibeTags.push("#DarkFantasy");
  if (animeGenres.includes("Slice of Life")) vibeTags.push("#HealingVibes");
  if (vibeTags.length < 2) vibeTags.push("#TopRated", "#BingeWorthy");

  return {
    anime,
    matchScore: finalScore,
    rationale,
    vibeTags: vibeTags.slice(0, 3),
    breakdown: {
      animation: animationRating,
      story: storyRating,
      hype: hypeRating,
    },
  };
}
