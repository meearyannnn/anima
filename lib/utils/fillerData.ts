export type FillerType = "canon" | "mixed" | "filler";

export interface FillerStatus {
  type: FillerType;
  label: string;
  badgeColor: string;
  textColor: string;
  isFiller: boolean;
}

// Known filler range intervals for long-running series [start, end]
const FILLER_MAP: Record<string, { fillers: [number, number][]; mixed?: [number, number][] }> = {
  naruto: {
    fillers: [[26, 26], [97, 97], [101, 106], [136, 219]],
    mixed: [[14, 16], [18, 18], [20, 21], [53, 53], [71, 71], [98, 100]],
  },
  "naruto shippuden": {
    fillers: [
      [57, 71], [90, 112], [144, 151], [170, 171], [176, 196],
      [223, 242], [257, 260], [271, 271], [279, 281], [284, 295],
      [303, 320], [347, 361], [376, 377], [388, 390], [394, 413],
      [416, 417], [422, 423], [427, 450], [464, 468], [480, 483],
    ],
    mixed: [[1, 2], [9, 9], [12, 12], [18, 19], [21, 21], [71, 71], [90, 92]],
  },
  "one piece": {
    fillers: [
      [54, 61], [98, 99], [101, 102], [131, 143], [196, 206],
      [220, 226], [279, 283], [317, 319], [326, 336], [382, 384],
      [426, 429], [457, 458], [492, 492], [542, 542], [575, 578],
      [590, 590], [626, 628], [747, 750], [780, 782], [895, 896],
      [907, 907], [1029, 1030],
    ],
    mixed: [[68, 69], [100, 100], [227, 228], [354, 354], [493, 494]],
  },
  bleach: {
    fillers: [
      [33, 33], [50, 50], [64, 109], [128, 137], [147, 149],
      [168, 189], [204, 205], [213, 214], [228, 265], [287, 287],
      [298, 299], [303, 305], [311, 341], [355, 355],
    ],
    mixed: [[8, 8], [27, 27], [46, 46], [110, 110], [160, 161]],
  },
  boruto: {
    fillers: [
      [16, 18], [40, 50], [67, 69], [93, 97], [104, 119],
      [138, 140], [152, 156], [256, 260],
    ],
    mixed: [[1, 15], [19, 23], [52, 60], [71, 92], [120, 137], [141, 151], [157, 180]],
  },
  "black clover": {
    fillers: [[29, 29], [66, 66], [68, 68], [82, 82], [123, 125], [131, 131], [134, 135], [142, 148]],
    mixed: [[3, 3], [70, 70], [153, 157]],
  },
  "my hero academia": {
    fillers: [[39, 39], [58, 58], [64, 64], [104, 104]],
  },
};

/**
 * Resolves whether an episode is Canon, Mixed, or Filler.
 */
export function getEpisodeFillerStatus(
  animeTitle: string,
  episodeNum: number
): FillerStatus {
  const normalized = animeTitle.toLowerCase();

  for (const [key, data] of Object.entries(FILLER_MAP)) {
    if (normalized.includes(key)) {
      // Check filler intervals
      for (const [start, end] of data.fillers) {
        if (episodeNum >= start && episodeNum <= end) {
          return {
            type: "filler",
            label: "Filler",
            badgeColor: "bg-red-500/20 border-red-500/40",
            textColor: "text-red-400",
            isFiller: true,
          };
        }
      }

      // Check mixed intervals
      if (data.mixed) {
        for (const [start, end] of data.mixed) {
          if (episodeNum >= start && episodeNum <= end) {
            return {
              type: "mixed",
              label: "Mixed Canon",
              badgeColor: "bg-amber-500/20 border-amber-500/40",
              textColor: "text-amber-400",
              isFiller: false,
            };
          }
        }
      }

      // If in mapped anime but not filler -> Canon
      return {
        type: "canon",
        label: "Manga Canon",
        badgeColor: "bg-emerald-500/20 border-emerald-500/40",
        textColor: "text-emerald-400",
        isFiller: false,
      };
    }
  }

  // Modern seasonal anime (Demon Slayer, JJK, Frieren, etc.) are 100% canon
  return {
    type: "canon",
    label: "Canon",
    badgeColor: "bg-emerald-500/15 border-emerald-500/30",
    textColor: "text-emerald-400",
    isFiller: false,
  };
}

/**
 * Finds the next canon episode, skipping over consecutive filler episodes.
 */
export function getNextCanonEpisode(
  animeTitle: string,
  currentEp: number,
  maxEp = 9999
): number {
  let next = currentEp + 1;
  while (next <= maxEp) {
    const status = getEpisodeFillerStatus(animeTitle, next);
    if (!status.isFiller) {
      return next;
    }
    next++;
  }
  return currentEp + 1; // fallback to next
}
