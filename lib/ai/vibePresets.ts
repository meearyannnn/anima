import type { LucideIcon } from "lucide-react";
import {
  Zap,
  Brain,
  Cpu,
  HeartCrack,
  Crown,
  Coffee,
  Skull,
  Globe,
} from "lucide-react";

export interface VibeArchetype {
  id: string;
  name: string;
  icon: string; // kept for backward compat
  lucideIcon: LucideIcon;
  tagline: string;
  query: string;
  genres: string[];
  vibeTags: string[];
  color: string;
  seedIds: number[];
  description: string;
}

export const VIBE_ARCHETYPES: VibeArchetype[] = [
  {
    id: "god-tier-animation",
    name: "God-Tier Animation",
    icon: "⚡",
    lucideIcon: Zap,
    tagline: "Jaw-dropping sakuga battles and earth-shattering climaxes",
    query: "Demon Slayer Jujutsu Kaisen Fate Chainsaw Man Mob Psycho",
    genres: ["Action", "Fantasy", "Supernatural"],
    vibeTags: ["#Sakuga", "#PeakAnimation", "#Adrenaline", "#StudioUfotable"],
    color: "#ff2a85",
    seedIds: [101922, 113415, 127230, 20447, 101347],
    description: "Visually stunning masterpieces with ultra-fluid choreography, heavy impact frames, and epic orchestral soundtracks."
  },
  {
    id: "dark-mind-games",
    name: "Dark Mind Games",
    icon: "🧠",
    lucideIcon: Brain,
    tagline: "High-stakes psychological warfare where one mistake is fatal",
    query: "Death Note Code Geass Monster Psycho-Pass Classroom of the Elite",
    genres: ["Psychological", "Mystery", "Thriller", "Drama"],
    vibeTags: ["#MindGames", "#AntiHero", "#GeniusProtagonist", "#Suspense"],
    color: "#a855f7",
    seedIds: [1535, 1575, 19, 13601, 98659],
    description: "Cerebral tactical battles, brilliant anti-heroes, and intense cat-and-mouse games where brains always triumph over brawn."
  },
  {
    id: "cyberpunk-dystopia",
    name: "Cyberpunk & Dystopia",
    icon: "🌌",
    lucideIcon: Cpu,
    tagline: "Neon-drenched alleyways, rogue cyborgs, and existential grit",
    query: "Cyberpunk Edgerunners Ghost in the Shell Vivy Akudama Drive",
    genres: ["Sci-Fi", "Action", "Psychological"],
    vibeTags: ["#Cyberpunk", "#NeonObsidian", "#AIRebellion", "#Futuristic"],
    color: "#00f0ff",
    seedIds: [126387, 43, 128547, 116566, 20757],
    description: "High tech, low life. Synthetic cybernetic augmentations, corporate mega-conglomerates, and philosophical synthwave vibes."
  },
  {
    id: "bittersweet-tears",
    name: "Emotional Tearjerkers",
    icon: "💔",
    lucideIcon: HeartCrack,
    tagline: "Heartfelt emotional rollercoasters that will leave you crying",
    query: "Your Lie in April A Silent Voice Violet Evergarden Clannad Anohana",
    genres: ["Drama", "Romance"],
    vibeTags: ["#EmotionalDamage", "#Poignant", "#Masterpiece", "#Tearjerker"],
    color: "#ec4899",
    seedIds: [20665, 20954, 21827, 4181, 9989],
    description: "Deeply moving narratives about loss, healing, music, and redemption that resonate long after the credits roll."
  },
  {
    id: "cold-anti-hero",
    name: "Overpowered Anti-Hero",
    icon: "👑",
    lucideIcon: Crown,
    tagline: "A ruthless, unstoppable lead who plays by their own rules",
    query: "Solo Leveling The Eminence in Shadow Overlord Hells Paradise",
    genres: ["Action", "Fantasy", "Supernatural"],
    vibeTags: ["#Overpowered", "#RuthlessMC", "#DarkFantasy", "#Badass"],
    color: "#f43f5e",
    seedIds: [151807, 130298, 19815, 128893, 117193],
    description: "Protagonists who embrace darkness, don't hold back, and dominate any foe that stands in their path."
  },
  {
    id: "cozy-healing",
    name: "Cozy & Healing",
    icon: "🍵",
    lucideIcon: Coffee,
    tagline: "Wholesome, soothing comfort to melt away daily stress",
    query: "Frieren Bocchi the Rock Laid-Back Camp Spy x Family",
    genres: ["Adventure", "Comedy", "Fantasy", "Slice of Life"],
    vibeTags: ["#ComfortShow", "#Wholesome", "#HealingVibes", "#Iyashikei"],
    color: "#10b981",
    seedIds: [154587, 130003, 98444, 140960, 21856],
    description: "Warm, aesthetic storytelling focused on quiet moments, warm food, gentle journeys, and heartwarming friendships."
  },
  {
    id: "psychological-horror",
    name: "Psychological Horror",
    icon: "🩸",
    lucideIcon: Skull,
    tagline: "Brutal realities, psychological descent, and cosmic terrors",
    query: "Attack on Titan Berserk Tokyo Ghoul Parasyte ReZero",
    genres: ["Horror", "Psychological", "Supernatural", "Action"],
    vibeTags: ["#DarkFantasy", "#Visceral", "#Survival", "#Brutal"],
    color: "#e11d48",
    seedIds: [16498, 33, 20702, 20605, 21355],
    description: "Unforgiving worlds where survival is earned through blood, sanity is tested, and humanity borders on monstrosity."
  },
  {
    id: "epic-odyssey",
    name: "Epic Odyssey",
    icon: "🚀",
    lucideIcon: Globe,
    tagline: "Vast continents, grand adventures, and unforgettable lore",
    query: "One Piece Hunter x Hunter Vinland Saga Made in Abyss",
    genres: ["Adventure", "Fantasy", "Action"],
    vibeTags: ["#GrandAdventure", "#Worldbuilding", "#EpicScope", "#Masterpiece"],
    color: "#f59e0b",
    seedIds: [21, 11061, 101348, 97986, 20434],
    description: "Deep expansive universes with rich histories, unique cultures, and an irresistible sense of wanderlust."
  },
];
