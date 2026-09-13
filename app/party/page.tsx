"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Sparkles,
  ArrowRight,
  Tv,
  MessageSquare,
  Flame,
  ShieldCheck,
  Play,
} from "lucide-react";
import { DualToneHeading } from "@/components/ui/DualToneHeading";
import { Button } from "@/components/ui/Button";

export default function PartyLobbyPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");

  const handleCreate = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (nickname.trim()) {
      localStorage.setItem("kuro_username", nickname.trim());
    }
    // Default to popular starter anime (Attack on Titan ID 16498) if not specified
    router.push(`/party/${code}?anime=16498&ep=1&host=1`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCode.trim().toUpperCase();
    if (!clean) return;
    if (nickname.trim()) {
      localStorage.setItem("kuro_username", nickname.trim());
    }
    router.push(`/party/${clean}`);
  };

  return (
    <div className="min-h-screen pt-28 pb-28 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col items-center justify-center">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-kuro-magenta/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Badge */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-kuro-card/80 border border-kuro-magenta/30 text-xs font-mono text-kuro-magenta mb-4 shadow-lg shadow-kuro-magenta/10"
      >
        <Sparkles className="w-3.5 h-3.5 animate-spin text-kuro-magenta" />
        <span>KuroSync Watch Party</span>
      </motion.div>

      {/* Main Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center max-w-2xl mb-8 space-y-3"
      >
        <DualToneHeading
          text="Stream Anime Together in Sync"
          className="text-3xl sm:text-5xl font-extrabold tracking-tight"
        />
        <p className="text-sm sm:text-base text-kuro-lavender/70 leading-relaxed">
          Create a private party room, invite friends with a single link, and binge your favorite anime with synchronized playback and flying bullet reactions.
        </p>
      </motion.div>

      {/* Action Cards Grid */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
        {/* Host Room Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-kuro-card/70 border border-white/10 hover:border-kuro-magenta/40 backdrop-blur-md flex flex-col justify-between group transition-all shadow-xl"
        >
          <div className="space-y-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-kuro-magenta/15 border border-kuro-magenta/30 flex items-center justify-center text-kuro-magenta group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-kuro-magenta transition-colors">
              Host a New Party
            </h3>
            <p className="text-xs text-kuro-lavender/70 leading-relaxed">
              Start an instant synced room. You control playback, episode selection, and invite permissions.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your Nickname (optional)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-kuro-surface border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-kuro-lavender/40 focus:outline-none focus:border-kuro-magenta"
            />
            <Button
              variant="primary"
              onClick={handleCreate}
              className="w-full justify-center shadow-lg shadow-kuro-magenta/20"
            >
              <Play className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </div>
        </motion.div>

        {/* Join Room Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl bg-kuro-card/70 border border-white/10 hover:border-white/20 backdrop-blur-md flex flex-col justify-between transition-all shadow-xl"
        >
          <div className="space-y-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-kuro-surface border border-white/10 flex items-center justify-center text-white/80">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Join with Room Code</h3>
            <p className="text-xs text-kuro-lavender/70 leading-relaxed">
              Got an invite code from a friend? Paste it below to jump straight into their live party stream.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              placeholder="Enter 6-char Code (e.g. X8J2A1)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full bg-kuro-surface border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white uppercase font-mono tracking-widest placeholder:tracking-normal placeholder-kuro-lavender/40 focus:outline-none focus:border-kuro-magenta"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={!roomCode.trim()}
              className="w-full justify-center"
            >
              Join Party
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </motion.div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl text-center">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
          <Tv className="w-5 h-5 text-kuro-magenta mx-auto mb-1" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Synced Playback
          </h4>
          <p className="text-[11px] text-kuro-lavender/60">
            Play, pause, and seek commands mirror across all connected tabs in real time.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
          <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Bullet Reactions
          </h4>
          <p className="text-[11px] text-kuro-lavender/60">
            Nico-Nico style floating emoji reactions fly across the video player with hype.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
          <MessageSquare className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Neon Live Chat
          </h4>
          <p className="text-[11px] text-kuro-lavender/60">
            Full glassmorphic chat sidebar with active viewer indicators and host badges.
          </p>
        </div>
      </div>
    </div>
  );
}
