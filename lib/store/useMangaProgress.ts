"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MangaProgress {
  mangaId: number;
  title: string;
  chapterId?: string;
  chapterNumber: string;
  pageIndex: number;
  totalPages: number;
  scrollPercentage: number;
  updatedAt: number;
}

interface MangaProgressStore {
  progressMap: Record<number, MangaProgress>;
  saveProgress: (progress: Omit<MangaProgress, "updatedAt">) => void;
  getProgress: (mangaId: number) => MangaProgress | undefined;
  clearProgress: (mangaId: number) => void;
}

export const useMangaProgress = create<MangaProgressStore>()(
  persist(
    (set, get) => ({
      progressMap: {},

      saveProgress: (progress) => {
        set((state) => ({
          progressMap: {
            ...state.progressMap,
            [progress.mangaId]: {
              ...progress,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      getProgress: (mangaId) => {
        return get().progressMap[mangaId];
      },

      clearProgress: (mangaId) => {
        set((state) => {
          const nextMap = { ...state.progressMap };
          delete nextMap[mangaId];
          return { progressMap: nextMap };
        });
      },
    }),
    {
      name: "anima-manga-progress-store",
    }
  )
);
