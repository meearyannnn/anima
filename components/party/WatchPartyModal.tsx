"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Play, ArrowRight, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { useToast } from "@/lib/store/useToast";

interface WatchPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeId?: number;
  animeTitle?: string;
  episode?: number;
}

export function WatchPartyModal({
  isOpen,
  onClose,
  animeId,
  animeTitle = "Anime",
  episode = 1,
}: WatchPartyModalProps) {
  const router = useRouter();
  const { success } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");

  if (!isOpen) return null;

  const handleCreateParty = () => {
    const randomRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const targetUrl = `/party/${randomRoomId}?anime=${animeId || 16498}&ep=${episode || 1}&host=1`;
    onClose();
    router.push(targetUrl);
  };

  const handleJoinParty = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) return;
    onClose();
    router.push(`/party/${cleanCode}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-2xl bg-kuro-card border border-white/15 p-6 shadow-2xl overflow-hidden z-10"
        >
          {/* Neon Glow accent */}
          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-kuro-magenta/30 blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-kuro-lavender/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-kuro-magenta/20 border border-kuro-magenta/30 flex items-center justify-center text-kuro-magenta">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <DualToneHeading text="KuroSync Party" className="text-xl font-bold" />
              <p className="text-xs text-kuro-lavender/70">
                Watch in perfect sync with your friends
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Host Section */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
                  Host This Episode
                </span>
                <span className="text-[11px] text-kuro-magenta font-mono">
                  Ep {episode}
                </span>
              </div>
              <p className="text-xs text-kuro-lavender/70 leading-relaxed truncate">
                {animeTitle}
              </p>
              <Button
                variant="primary"
                className="w-full justify-center shadow-lg shadow-kuro-magenta/20"
                onClick={handleCreateParty}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Launch Watch Party Room
              </Button>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-xs text-kuro-lavender/40 uppercase font-mono">
                or join friend
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* Join via Code */}
            <form onSubmit={handleJoinParty} className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char Room Code (e.g. X9K2A1)"
                  maxLength={10}
                  className="flex-1 bg-kuro-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono tracking-widest placeholder:tracking-normal placeholder-kuro-lavender/40 focus:outline-none focus:border-kuro-magenta"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!joinCode.trim()}
                  className="px-4 shrink-0"
                >
                  Join
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
