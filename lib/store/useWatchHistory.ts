"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchHistoryItem, PlaybackTimestamp } from "@/lib/types";

export function formatTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface WatchHistoryStore {
  history: WatchHistoryItem[];
  addToHistory: (item: Omit<WatchHistoryItem, "watchedAt">) => void;
  updateProgress: (animeId: number, episode: number, progress: number, season?: number) => void;
  savePlaybackTimestamp: (
    animeId: number,
    episode: number,
    currentTime: number,
    duration: number,
    season?: number,
    animeTitle?: string,
    coverImage?: string
  ) => void;
  getPlaybackTimestamp: (animeId: number, episode: number, season?: number) => PlaybackTimestamp | null;
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

      savePlaybackTimestamp: (
        animeId,
        episode,
        currentTime,
        duration,
        season = 1,
        animeTitle = "",
        coverImage = ""
      ) => {
        if (isNaN(currentTime) || currentTime < 0) return;
        const validDuration = isNaN(duration) || duration <= 0 ? 1440 : duration;
        const progress = Math.min(1, Math.max(0, currentTime / validDuration));

        set((state) => {
          const idx = state.history.findIndex(
            (h) => h.animeId === animeId && h.episode === episode && (h.season ? h.season === season : true)
          );

          if (idx >= 0) {
            const updated = [...state.history];
            updated[idx] = {
              ...updated[idx],
              currentTime,
              duration: validDuration,
              progress,
              watchedAt: Date.now(),
            };
            return { history: updated };
          } else if (animeTitle) {
            const newItem: WatchHistoryItem = {
              animeId,
              animeTitile: animeTitle,
              coverImage,
              episode,
              season,
              progress,
              currentTime,
              duration: validDuration,
              totalDuration: validDuration,
              watchedAt: Date.now(),
            };
            return { history: [newItem, ...state.history].slice(0, 100) };
          }
          return state;
        });
      },

      getPlaybackTimestamp: (animeId, episode, season = 1) => {
        const item = get().history.find(
          (h) => h.animeId === animeId && h.episode === episode && (h.season ? h.season === season : true)
        );
        if (!item || item.currentTime === undefined || item.currentTime <= 10) {
          return null;
        }
        // If within the last 30s of the episode, don't resume right at the end
        if (item.duration && item.currentTime >= item.duration - 30) {
          return null;
        }
        return {
          currentTime: item.currentTime,
          duration: item.duration ?? item.totalDuration ?? 1440,
          formatted: formatTimestamp(item.currentTime),
          progress: item.progress ?? 0,
        };
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

/**
 * Direct accessor to get playback timestamp without React hook reactivity
 */
export function getStoredPlaybackTimestamp(animeId: number, episode: number, season = 1): PlaybackTimestamp | null {
  return useWatchHistory.getState().getPlaybackTimestamp(animeId, episode, season);
}

export const getPlaybackTimestamp = getStoredPlaybackTimestamp;

