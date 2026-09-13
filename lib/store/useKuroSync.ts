"use client";

import { create } from "zustand";

export interface SyncUser {
  id: string;
  name: string;
  avatarColor: string;
  isHost: boolean;
  joinedAt: number;
}

export interface SyncMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface BulletReaction {
  id: string;
  emoji: string;
  senderName: string;
  topPercent: number; // Vertical lane 15% - 75%
  speedDuration: number;
}

export interface SyncAnime {
  id: number;
  title: string;
  coverImage?: string;
  episode: number;
  totalEpisodes?: number;
}

interface KuroSyncState {
  roomId: string | null;
  currentUser: SyncUser | null;
  activeUsers: SyncUser[];
  anime: SyncAnime | null;
  isPlaying: boolean;
  currentTime: number;
  messages: SyncMessage[];
  bulletReactions: BulletReaction[];
  isConnected: boolean;
  channel: BroadcastChannel | null;

  initRoom: (roomId: string, userNickname?: string, initialAnime?: SyncAnime, asHost?: boolean) => void;
  sendChatMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  setPlayback: (isPlaying: boolean, time?: number) => void;
  setEpisode: (episode: number) => void;
  leaveRoom: () => void;
}

const AVATAR_COLORS = [
  "#FF2A85", // Cyber Magenta
  "#00F5FF", // Neon Cyan
  "#8B5CF6", // Electric Purple
  "#10B981", // Emerald
  "#F59E0B", // Amber Gold
  "#EC4899", // Hot Pink
];

export const useKuroSync = create<KuroSyncState>((set, get) => ({
  roomId: null,
  currentUser: null,
  activeUsers: [],
  anime: null,
  isPlaying: false,
  currentTime: 0,
  messages: [],
  bulletReactions: [],
  isConnected: false,
  channel: null,

  initRoom: (roomId, userNickname, initialAnime, asHost = false) => {
    // Clean up previous channel if any
    const prevChannel = get().channel;
    if (prevChannel) {
      try {
        prevChannel.close();
      } catch {}
    }

    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const savedName = typeof window !== "undefined" ? localStorage.getItem("kuro_username") : null;
    const finalName = userNickname || savedName || `Otaku_${Math.floor(1000 + Math.random() * 9000)}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("kuro_username", finalName);
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const user: SyncUser = {
      id: userId,
      name: finalName,
      avatarColor: randomColor,
      isHost: asHost,
      joinedAt: Date.now(),
    };

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(`kurosync_${roomId}`);
      } catch (err) {
        console.warn("BroadcastChannel not supported", err);
      }
    }

    set({
      roomId,
      currentUser: user,
      activeUsers: [user],
      anime: initialAnime || {
        id: 16498,
        title: "Attack on Titan",
        coverImage: "",
        episode: 1,
      },
      messages: [
        {
          id: `sys_${Date.now()}`,
          userId: "system",
          userName: "KuroSync Bot",
          userColor: "#FF2A85",
          text: `Welcome to Party Room #${roomId}! Share the room link to watch together.`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ],
      isConnected: true,
      channel: bc,
    });

    if (bc) {
      // Broadcast join event
      bc.postMessage({
        type: "USER_JOINED",
        user,
      });

      bc.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        const state = get();

        switch (data.type) {
          case "USER_JOINED": {
            const newUser = data.user as SyncUser;
            if (newUser.id === state.currentUser?.id) return;
            const updatedUsers = [...state.activeUsers.filter((u) => u.id !== newUser.id), newUser];
            set({
              activeUsers: updatedUsers,
              messages: [
                ...state.messages,
                {
                  id: `join_${Date.now()}`,
                  userId: "system",
                  userName: "KuroSync",
                  userColor: newUser.avatarColor,
                  text: `${newUser.name} joined the watch party! 🎉`,
                  timestamp: Date.now(),
                  isSystem: true,
                },
              ],
            });

            // If we are host, send current state to new joiner
            if (state.currentUser?.isHost) {
              bc?.postMessage({
                type: "SYNC_FULL_STATE",
                anime: state.anime,
                isPlaying: state.isPlaying,
                currentTime: state.currentTime,
                activeUsers: updatedUsers,
              });
            }
            break;
          }

          case "SYNC_FULL_STATE": {
            if (!state.currentUser?.isHost) {
              set({
                anime: data.anime || state.anime,
                isPlaying: data.isPlaying,
                currentTime: data.currentTime,
                activeUsers: data.activeUsers?.length ? data.activeUsers : state.activeUsers,
              });
            }
            break;
          }

          case "CHAT_MESSAGE": {
            set({ messages: [...state.messages, data.message] });
            break;
          }

          case "BULLET_REACTION": {
            const reaction = data.reaction as BulletReaction;
            set({ bulletReactions: [...state.bulletReactions, reaction] });
            // auto-clean reaction after animation duration
            setTimeout(() => {
              set((s) => ({
                bulletReactions: s.bulletReactions.filter((r) => r.id !== reaction.id),
              }));
            }, reaction.speedDuration * 1000 + 500);
            break;
          }

          case "PLAYBACK_CHANGE": {
            set({ isPlaying: data.isPlaying, currentTime: data.currentTime ?? state.currentTime });
            break;
          }

          case "EPISODE_CHANGE": {
            if (state.anime) {
              set({
                anime: { ...state.anime, episode: data.episode },
                messages: [
                  ...state.messages,
                  {
                    id: `ep_${Date.now()}`,
                    userId: "system",
                    userName: "KuroSync",
                    userColor: "#FF2A85",
                    text: `Host switched to Episode ${data.episode}`,
                    timestamp: Date.now(),
                    isSystem: true,
                  },
                ],
              });
            }
            break;
          }

          case "USER_LEFT": {
            set({
              activeUsers: state.activeUsers.filter((u) => u.id !== data.userId),
            });
            break;
          }
        }
      };
    }
  },

  sendChatMessage: (text) => {
    const { currentUser, messages, channel } = get();
    if (!text.trim() || !currentUser) return;

    const newMsg: SyncMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: currentUser.avatarColor,
      text: text.trim(),
      timestamp: Date.now(),
    };

    set({ messages: [...messages, newMsg] });

    if (channel) {
      channel.postMessage({
        type: "CHAT_MESSAGE",
        message: newMsg,
      });
    }
  },

  sendReaction: (emoji) => {
    const { currentUser, bulletReactions, channel } = get();
    if (!currentUser) return;

    const reaction: BulletReaction = {
      id: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      emoji,
      senderName: currentUser.name,
      topPercent: Math.floor(15 + Math.random() * 65), // random lane across screen
      speedDuration: 4.5 + Math.random() * 1.5,
    };

    set({ bulletReactions: [...bulletReactions, reaction] });

    if (channel) {
      channel.postMessage({
        type: "BULLET_REACTION",
        reaction,
      });
    }

    setTimeout(() => {
      set((s) => ({
        bulletReactions: s.bulletReactions.filter((r) => r.id !== reaction.id),
      }));
    }, reaction.speedDuration * 1000 + 500);
  },

  setPlayback: (isPlaying, time) => {
    const { channel } = get();
    set((s) => ({ isPlaying, currentTime: time !== undefined ? time : s.currentTime }));

    if (channel) {
      channel.postMessage({
        type: "PLAYBACK_CHANGE",
        isPlaying,
        currentTime: time,
      });
    }
  },

  setEpisode: (episode) => {
    const { anime, channel } = get();
    if (!anime) return;
    set({ anime: { ...anime, episode } });

    if (channel) {
      channel.postMessage({
        type: "EPISODE_CHANGE",
        episode,
      });
    }
  },

  leaveRoom: () => {
    const { channel, currentUser } = get();
    if (channel && currentUser) {
      channel.postMessage({
        type: "USER_LEFT",
        userId: currentUser.id,
      });
      try {
        channel.close();
      } catch {}
    }
    set({
      roomId: null,
      currentUser: null,
      activeUsers: [],
      channel: null,
      isConnected: false,
    });
  },
}));
