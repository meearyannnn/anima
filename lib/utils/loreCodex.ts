export interface LoreCharacter {
  name: string;
  japaneseName?: string;
  role: "Protagonist" | "Antagonist" | "Ally" | "Mentor" | "Anti-Hero";
  affiliation: string;
  rank?: string;
  avatar: string;
  firstAppearanceEpisode: number;
  spoilerPastEpisode?: number;
  cleanBio: string;
  classifiedBio?: string;
  powers: string[];
}

export interface LoreCodexData {
  synopsisLore: string;
  powerSystem: {
    name: string;
    description: string;
    rules: string[];
  };
  characters: LoreCharacter[];
}

// Curated context-aware lore for flagship anime
const LORE_DATABASE: Record<string, LoreCodexData> = {
  jujutsu: {
    synopsisLore: "Sorcerers battle against cursed spirits born from negative human emotions using refined cursed energy.",
    powerSystem: {
      name: "Cursed Energy & Domain Expansion",
      description: "Harnessing volatile negative emotions into refined cursed techniques, culminating in barrier Domain Expansions that ensure guaranteed-hit effects.",
      rules: [
        "Binding Vows increase technique potency through self-imposed restrictions.",
        "Simple Domains neutralize domain sure-hit attacks.",
        "Black Flash: Distortion of space when cursed energy impacts within 0.000001 seconds of physical hit."
      ]
    },
    characters: [
      {
        name: "Yuji Itadori",
        role: "Protagonist",
        affiliation: "Tokyo Jujutsu High",
        avatar: "https://image.tmdb.org/t/p/w200/2GfC42W0p4oW54Y08L9k2d21w0N.jpg",
        firstAppearanceEpisode: 1,
        cleanBio: "A superhumanly gifted teenager who swallowed one of Ryomen Sukuna's fingers to save his school friends.",
        classifiedBio: "Vessel for the King of Curses. Gradually absorbs Sukuna's immense cursed energy and masters Divergent Fist and Black Flash.",
        spoilerPastEpisode: 19,
        powers: ["Superhuman Physicality", "Divergent Fist", "Black Flash", "Sukuna Vessel Resistance"]
      },
      {
        name: "Satoru Gojo",
        role: "Mentor",
        affiliation: "Tokyo Jujutsu High",
        rank: "Special Grade Sorcerer",
        avatar: "https://image.tmdb.org/t/p/w200/9k8K069P3x1z4z339v.jpg",
        firstAppearanceEpisode: 1,
        cleanBio: "The undisputed strongest modern Jujutsu Sorcerer, possessing both the Limitless cursed technique and the Six Eyes.",
        classifiedBio: "Domain Expansion: Unlimited Void floods targets with infinite information, paralyzing them instantly.",
        spoilerPastEpisode: 7,
        powers: ["Infinity Barrier", "Lapse Blue", "Reversal Red", "Hollow Purple", "Unlimited Void"]
      },
      {
        name: "Megumi Fushiguro",
        role: "Ally",
        affiliation: "Tokyo Jujutsu High",
        avatar: "https://image.tmdb.org/t/p/w200/8k1x2z983991.jpg",
        firstAppearanceEpisode: 1,
        cleanBio: "A calculated first-year sorcerer wielding the legendary Zenin clan Ten Shadows Technique.",
        classifiedBio: "Summons divine shikigami from liquid shadows, culminating in the untamable Eight-Handled Sword Divergent Sila Divine General Mahoraga.",
        spoilerPastEpisode: 24,
        powers: ["Ten Shadows Technique", "Divine Dog", "Nue", "Toad", "Chimera Shadow Garden"]
      },
      {
        name: "Ryomen Sukuna",
        role: "Antagonist",
        affiliation: "Heian Era (King of Curses)",
        avatar: "https://image.tmdb.org/t/p/w200/7x7912.jpg",
        firstAppearanceEpisode: 1,
        cleanBio: "A merciless ancient demonic calamity residing within Yuji's soul, awaiting complete reincarnation.",
        classifiedBio: "Wields invisible slashing techniques Dismantle and Cleave, alongside furnace fire manipulation and Malevolent Shrine.",
        spoilerPastEpisode: 4,
        powers: ["Malevolent Shrine", "Dismantle", "Cleave", "Reverse Cursed Technique", "Fire Arrow"]
      }
    ]
  },
  demon: {
    synopsisLore: "The Demon Slayer Corps fights to protect humanity from flesh-eating demons spawned by Muzan Kibutsuji.",
    powerSystem: {
      name: "Breathing Styles & Total Concentration",
      description: "Swordsmen synchronize extreme lung oxygen intake with cardiovascular surges to perform superhuman elemental sword arts.",
      rules: [
        "Sun Breathing is the primordial progenitor style of all derived breath techniques.",
        "Nichirin blades forged from scarlet iron absorb sunlight, decapitating demons.",
        "Demon Slayer Marks grant enhanced spatial perception and transparent world vision."
      ]
    },
    characters: [
      {
        name: "Tanjiro Kamado",
        role: "Protagonist",
        affiliation: "Demon Slayer Corps",
        avatar: "https://image.tmdb.org/t/p/w200/9k8K069P3x1z4z339v.jpg",
        firstAppearanceEpisode: 1,
        cleanBio: "A kind-hearted boy with an acute sense of smell seeking a cure for his demonized sister Nezuko.",
        classifiedBio: "Inheritor of the Kamado family Hinokami Kagura, discovering it is the ancestral Sun Breathing technique.",
        spoilerPastEpisode: 19,
        powers: ["Water Breathing (Forms 1-10)", "Hinokami Kagura (Sun Breathing)", "Acute Sense of Smell", "Hard Forehead"]
      },
      {
        name: "Nezuko Kamado",
        role: "Ally",
        affiliation: "Kamado Family / Demon Slayer Corps",
        avatar: "https://image.tmdb.org/t/p/w200/2GfC42W0p4oW54Y08L9k2d21w0N.jpg",
        firstAppearanceEpisode: 1,
        cleanBio: "Tanjiro's younger sister who retained human emotions after transforming into a demon.",
        classifiedBio: "Refuses human blood, recovering through sleep. Awakens explosive Blood Demon Art Pyrokinesis that harms only demons.",
        spoilerPastEpisode: 19,
        powers: ["Size Alteration", "Exploding Blood Pyrokinesis", "Enhanced Regeneration", "Awakened Berserk State"]
      },
      {
        name: "Muzan Kibutsuji",
        role: "Antagonist",
        affiliation: "Demon Progenitor",
        avatar: "https://image.tmdb.org/t/p/w200/7x7912.jpg",
        firstAppearanceEpisode: 7,
        cleanBio: "The cold, immortal progenitor of all demons seeking the Blue Spider Lily to overcome sunlight.",
        classifiedBio: "Possesses multiple hearts and brains, instantaneous cellular regeneration, and absolute telepathic control over all demon biology.",
        spoilerPastEpisode: 26,
        powers: ["Cellular Transmutation", "Shape Shifting", "Curse of Blood", "Instant Regeneration"]
      }
    ]
  },
  solo: {
    synopsisLore: "Hunters raid extradimensional Dungeons connected to Earth via magical Gates.",
    powerSystem: {
      name: "Hunter Mana & Awakening",
      description: "Humanity awakens to mana ranks (E to S). While ranks are universally permanent, Sung Jinwoo accesses an architectural System.",
      rules: [
        "Awakened mana ranks never change under natural conditions.",
        "Dungeon Breaks occur when Gates remain uncleared for seven days.",
        "Shadow Extraction turns defeated foes into eternal loyal spirit soldiers."
      ]
    },
    characters: [
      {
        name: "Sung Jinwoo",
        role: "Protagonist",
        affiliation: "Shadow Monarch",
        avatar: "https://image.tmdb.org/t/p/w200/2GfC42W0p4oW54Y08L9k2d21w0N.jpg",
        firstAppearanceEpisode: 1,
        cleanBio: "Known as the Weakest Hunter of All Mankind (E-Rank), risking his life to pay for his mother's medical bills.",
        classifiedBio: "Re-awakened as the Player of the Courage System. Levels up stats indefinitely and awakens the Shadow Extraction monarch authority.",
        spoilerPastEpisode: 12,
        powers: ["Shadow Extraction", "Bloodlust", "Sprint", "Rulers Authority (Telekinesis)", "Domain of the Monarch"]
      }
    ]
  }
};

/**
 * Returns contextual lore codex for an anime
 */
export function getAnimeLoreCodex(title: string): LoreCodexData {
  const t = title.toLowerCase();
  if (t.includes("jujutsu")) return LORE_DATABASE.jujutsu;
  if (t.includes("demon") || t.includes("slayer") || t.includes("kimetsu")) return LORE_DATABASE.demon;
  if (t.includes("solo") || t.includes("leveling")) return LORE_DATABASE.solo;

  // Generic fallback lore
  return {
    synopsisLore: "An extraordinary saga following gifted individuals navigating conflicts across uncharted worlds.",
    powerSystem: {
      name: "Specialized Combat & Abilities",
      description: "Characters train disciplines, awaken hidden potential, and refine their combat techniques against escalating threats.",
      rules: [
        "Willpower and intense training push physical limits.",
        "Mastering tactical weaknesses turns the tide in battle."
      ]
    },
    characters: [
      {
        name: "Main Protagonist",
        role: "Protagonist",
        affiliation: "Vanguard Team",
        avatar: "https://image.tmdb.org/t/p/w200/2GfC42W0p4oW54Y08L9k2d21w0N.jpg",
        firstAppearanceEpisode: 1,
        cleanBio: "The central figure on a journey of growth, forging bonds and overcoming impossible odds.",
        powers: ["Unmatched Determination", "Tactical Acumen", "Latent Awakening"]
      }
    ]
  };
}
