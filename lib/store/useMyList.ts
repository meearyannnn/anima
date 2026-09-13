"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MyListItem, WatchlistCategory } from "@/lib/types";

interface MyListStore {
  list: MyListItem[];
  addToList: (item: Omit<MyListItem, "addedAt">) => void;
  removeFromList: (id: number) => void;
  updateCategory: (id: number, category: WatchlistCategory) => void;
  isInList: (id: number) => boolean;
  clearList: () => void;
}

export const useMyList = create<MyListStore>()(
  persist(
    (set, get) => ({
      list: [],

      addToList: (item) => {
        set((state) => {
          if (state.list.some((i) => i.id === item.id)) return state;
          return {
            list: [
              { ...item, category: item.category || "watching", addedAt: Date.now() },
              ...state.list,
            ],
          };
        });
      },

      removeFromList: (id) => {
        set((state) => ({
          list: state.list.filter((i) => i.id !== id),
        }));
      },

      updateCategory: (id, category) => {
        set((state) => ({
          list: state.list.map((i) => (i.id === id ? { ...i, category } : i)),
        }));
      },

      isInList: (id) => get().list.some((i) => i.id === id),

      clearList: () => set({ list: [] }),
    }),
    {
      name: "kurostream-my-list",
    }
  )
);
