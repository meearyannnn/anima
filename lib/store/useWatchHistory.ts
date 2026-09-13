"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchHistoryItem } from "@/lib/types";

interface WatchHistoryStore {
  history: WatchHistoryItem[];
  addToHistory: (item: Omit<WatchHistoryItem, "watchedAt">) => void;
  updateProgress: (animeId: number, episode: number, progress: number, season?: number) => void;
  getProgress: (animeId: number, episode: number, season?: number) => number;
  isEpisodeWatched: (animeId: number, episode: number, season?: number) => boolean;
  toggleEpisodeWatched: (
    animeId: number,
    episode: number,
    animeTitle: string,
    coverImage: string,
    season?: number
  ) => boolean;
  markSeasonCompleted: (
    animeId: number,
    animeTitle: string,
    coverImage: string,
    episodeCount: number,
    season?: number
  ) => void;
  resetSeasonProgress: (animeId: number, episodeCount: number, season?: number) => void;
  removeFromHistory: (animeId: number, episode: number) => void;
  clearHistory: () => void;
}

export const useWatchHistory = create<WatchHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],

      addToHistory: (item) => {
        set((state) => {
          const itemSeason = item.season ?? 1;
          const filtered = state.history.filter(
            (h) =>
              !(
                h.animeId === item.animeId &&
                (h.season ?? 1) === itemSeason &&
                h.episode === item.episode
              )
          );
          const newItem: WatchHistoryItem = { ...item, season: itemSeason, watchedAt: Date.now() };
          return { history: [newItem, ...filtered].slice(0, 100) };
        });
      },

      updateProgress: (animeId, episode, progress, season = 1) => {
        set((state) => {
          const idx = state.history.findIndex(
            (h) => h.animeId === animeId && h.episode === episode && (h.season ? h.season === season : true)
          );
          if (idx < 0) return state;
          const updated = [...state.history];
          updated[idx] = { ...updated[idx], progress, watchedAt: Date.now() };
          return { history: updated };
        });
      },

      getProgress: (animeId, episode, season = 1) => {
        const item = get().history.find(
          (h) => h.animeId === animeId && h.episode === episode && (h.season ? h.season === season : true)
        );
        return item?.progress ?? 0;
      },

      isEpisodeWatched: (animeId, episode, season = 1) => {
        const item = get().history.find(
          (h) => h.animeId === animeId && h.episode === episode && (h.season ? h.season === season : true)
        );
        return (item?.progress ?? 0) >= 0.85;
      },

      toggleEpisodeWatched: (animeId, episode, animeTitle, coverImage, season = 1) => {
        const isWatched = get().isEpisodeWatched(animeId, episode, season);
        if (isWatched) {
          // Mark unwatched
          set((state) => ({
            history: state.history.filter(
              (h) => !(h.animeId === animeId && h.episode === episode && (h.season ? h.season === season : true))
            ),
          }));
          return false;
        } else {
          // Mark watched (1.0 progress)
          get().addToHistory({
            animeId,
            animeTitile: animeTitle,
            coverImage,
            episode,
            season,
            progress: 1.0,
            totalDuration: 1440,
          });
          return true;
        }
      },

      markSeasonCompleted: (animeId, animeTitle, coverImage, episodeCount, season = 1) => {
        set((state) => {
          const newEntries: WatchHistoryItem[] = [];
          for (let ep = 1; ep <= episodeCount; ep++) {
            newEntries.push({
              animeId,
              animeTitile: animeTitle,
              coverImage,
              episode: ep,
              season,
              progress: 1.0,
              totalDuration: 1440,
              watchedAt: Date.now(),
            });
          }

          // Filter out existing entries for this anime and season, then add all new completed entries
          const remaining = state.history.filter(
            (h) => !(h.animeId === animeId && (h.season ? h.season === season : true))
          );
          return { history: [...newEntries, ...remaining].slice(0, 150) };
        });
      },

      resetSeasonProgress: (animeId, episodeCount, season = 1) => {
        set((state) => ({
          history: state.history.filter(
            (h) => !(h.animeId === animeId && (h.season ? h.season === season : true))
          ),
        }));
      },

      removeFromHistory: (animeId, episode) => {
        set((state) => ({
          history: state.history.filter(
            (h) => !(h.animeId === animeId && h.episode === episode)
          ),
        }));
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "kurostream-watch-history",
    }
  )
);
