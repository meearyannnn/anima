"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Users,
  Copy,
  Check,
  Smile,
  Crown,
  Sparkles,
  MessageSquare,
  X,
  Flame,
} from "lucide-react";
import { useKuroSync } from "@/lib/store/useKuroSync";
import { useToast } from "@/lib/store/useToast";
import { cn } from "@/lib/utils";

const QUICK_EMOJIS = ["🔥", "⚡", "😱", "😭", "🍿", "💖", "💀", "👑"];

interface PartyChatDrawerProps {
  className?: string;
  isCompact?: boolean;
}

export function PartyChatDrawer({ className, isCompact = false }: PartyChatDrawerProps) {
  const [inputVal, setInputVal] = useState("");
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    roomId,
    currentUser,
    activeUsers,
    messages,
    sendChatMessage,
    sendReaction,
    isConnected,
  } = useKuroSync();
  const { success } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    sendChatMessage(inputVal);
    setInputVal("");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      success("Party room link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-2xl bg-kuro-card/90 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-kuro-surface/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-4 h-4 text-kuro-magenta" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Party Room
              </span>
              <span className="text-[11px] font-mono text-kuro-magenta bg-kuro-magenta/10 px-1.5 py-0.5 rounded border border-kuro-magenta/20">
                #{roomId || "LOBBY"}
              </span>
            </div>
            <p className="text-[11px] text-kuro-lavender/60">
              {activeUsers.length} {activeUsers.length === 1 ? "watcher" : "watchers"} in sync
            </p>
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-kuro-text hover:text-white transition-all active:scale-95"
          title="Copy Room Link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-kuro-lavender" />
              <span className="text-[11px]">Invite</span>
            </>
          )}
        </button>
      </div>

      {/* Active Watchers Chips */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/5 bg-kuro-surface/30 overflow-x-auto no-scrollbar">
        {activeUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/80 shrink-0"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.avatarColor }}
            />
            <span className="truncate max-w-[80px] font-medium">{user.name}</span>
            {user.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div
                key={msg.id}
                className="text-center my-1.5 py-1 px-2.5 rounded-lg bg-white/[0.03] text-[11px] text-kuro-lavender/70 border border-white/5 font-mono"
              >
                {msg.text}
              </div>
            );
          }

          const isMe = msg.userId === currentUser?.id;

          return (
            <div
              key={msg.id}
              className={cn("flex flex-col gap-0.5 max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}
            >
              <span className="text-[10px] font-semibold text-kuro-lavender/70 px-1 flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: msg.userColor }}
                />
                {msg.userName}
              </span>
              <div
                className={cn(
                  "py-1.5 px-3 rounded-2xl break-words leading-relaxed text-xs shadow-md",
                  isMe
                    ? "bg-gradient-to-r from-kuro-magenta to-pink-600 text-white rounded-br-xs"
                    : "bg-kuro-surface border border-white/10 text-kuro-text rounded-bl-xs"
                )}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Emoji Reactions Quick Bar */}
      <div className="px-3 pt-2 pb-1 border-t border-white/5 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-125 transition-transform text-base shrink-0 select-none cursor-pointer"
            title={`Send ${emoji} bullet reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="p-2.5 border-t border-white/10 bg-kuro-surface/50 flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Say something to the room..."
          className="flex-1 bg-kuro-card/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-kuro-lavender/40 focus:outline-none focus:border-kuro-magenta/60 transition-colors"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="p-2 rounded-xl bg-kuro-magenta hover:bg-kuro-magenta/90 text-white disabled:opacity-40 disabled:hover:bg-kuro-magenta transition-all active:scale-95 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
