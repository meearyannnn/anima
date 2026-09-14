"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bookmark, Home, Compass, Menu, X, Sparkles, Users, BookOpen, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyList } from "@/lib/store/useMyList";
import { useCommandPalette } from "@/lib/store/useCommandPalette";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Discover", icon: Compass },
  { href: "/manga", label: "Manga", icon: BookOpen },
  { href: "/party", label: "Party", icon: Users },
  { href: "/my-list", label: "Vault", icon: Bookmark },
];

const mobileBottomNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Discover", icon: Compass },
  { href: "/manga", label: "Manga", icon: BookOpen },
  { href: "/my-list", label: "Vault", icon: Bookmark },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { list } = useMyList();
  const { open: openCommandPalette } = useCommandPalette();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Completely hide Navbar on manga reading pages (/manga/:id/:chapter) for Kindle-like distraction-free focus
  const isMangaReader = pathname ? /^\/manga\/[^/]+\/[^/]+/.test(pathname) : false;
  if (isMangaReader) {
    return null;
  }

  return (
    <>
      {/* Floating Glass Dock Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 md:px-8 py-3 transition-all duration-500 pointer-events-none">
        <div className="max-w-7xl mx-auto relative pointer-events-auto">
          {/* Ambient Background Aura Glow */}
          <div
            className={cn(
              "absolute -inset-1 rounded-full blur-xl transition-all duration-500 pointer-events-none opacity-60",
              scrolled
                ? "bg-gradient-to-r from-magenta-600/30 via-pink-500/20 to-purple-600/30 opacity-90"
                : "bg-gradient-to-r from-magenta-600/15 via-pink-500/10 to-purple-600/15 opacity-40"
            )}
          />

          {/* Island Container */}
          <div
            className={cn(
              "relative flex items-center justify-between px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-300",
              scrolled
                ? "bg-black/80 backdrop-blur-3xl border border-white/[0.12] shadow-[0_12px_40px_-5px_rgba(0,0,0,0.9),0_0_20px_rgba(255,42,133,0.15)]"
                : "bg-black/50 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)]"
            )}
          >
            {/* Brand Logo - Minimal, Glowing & Sleek */}
            <Link href="/" className="flex items-center gap-2.5 group relative select-none">
              <div className="relative flex items-center justify-center w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-gradient-to-br from-magenta-500 via-pink-500 to-rose-600 text-white font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(255,42,133,0.45)] border border-white/25 overflow-hidden group-hover:scale-105 group-hover:shadow-[0_0_28px_rgba(255,42,133,0.7)] transition-all duration-300">
                <span className="relative z-10 font-black tracking-tighter">A</span>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/30" />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-display text-base sm:text-lg font-black tracking-tight leading-none">
                  <span className="bg-gradient-to-r from-magenta-400 via-pink-400 to-rose-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,42,133,0.35)]">
                    ANIMA
                  </span>
                  <span className="text-white ml-0.5 tracking-tight">STREAM</span>
                </span>
                <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-magenta-500/10 border border-magenta-500/30 text-[9px] font-bold text-magenta-300 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-magenta-400 animate-pulse" />
                  Live
                </span>
              </div>
            </Link>

            {/* Desktop Nav - Ultra Sleek Pill Dock */}
            <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.07] p-1.5 rounded-full backdrop-blur-2xl shadow-inner shadow-black/40">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-2 select-none group",
                      isActive
                        ? "text-white font-bold"
                        : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-magenta-500/25 via-pink-500/20 to-purple-500/25 border border-magenta-500/40 shadow-[0_0_20px_rgba(255,42,133,0.3)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={14}
                      className={cn(
                        "relative z-10 transition-colors duration-200",
                        isActive
                          ? "text-magenta-400 drop-shadow-[0_0_8px_rgba(255,42,133,0.8)]"
                          : "text-white/60 group-hover:text-white"
                      )}
                    />
                    <span className="relative z-10 tracking-wide">{link.label}</span>

                    {link.href === "/my-list" && list.length > 0 && (
                      <span className="relative z-10 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white shadow-[0_0_10px_rgba(255,42,133,0.6)] ml-0.5">
                        {list.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions: Capsule Quick Search */}
            <div className="flex items-center gap-2">
              <button
                onClick={openCommandPalette}
                className="flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-magenta-500/40 text-xs text-white/70 hover:text-white transition-all duration-300 group shadow-sm hover:shadow-[0_0_20px_rgba(255,42,133,0.15)]"
                aria-label="Search"
              >
                <Search
                  size={14}
                  className="text-white/50 group-hover:text-magenta-400 group-hover:scale-110 transition-all duration-300"
                />
                <span className="hidden sm:inline font-medium text-white/60 group-hover:text-white transition-colors">
                  Quick search...
                </span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10 shadow-inner">
                  <Command size={10} /> K
                </kbd>
              </button>

              {/* Mobile menu toggle button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-full text-white/70 hover:text-white bg-white/[0.04] border border-white/[0.08] transition-all"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md md:hidden"
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-72 z-50 bg-black/90 border-l border-white/10 backdrop-blur-3xl md:hidden flex flex-col pt-20 px-6 gap-3"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all",
                        isActive
                          ? "bg-gradient-to-r from-magenta-500/20 to-pink-500/15 text-white border border-magenta-500/30 shadow-[0_0_15px_rgba(255,42,133,0.2)]"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? "text-magenta-400" : "text-white/60"} />
                        <span>{link.label}</span>
                      </div>
                      {link.href === "/my-list" && list.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white font-bold">
                          {list.length}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Floating Bottom Dock for Mobile */}
      <nav className="fixed bottom-3 left-3 right-3 z-40 md:hidden bg-black/85 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(255,42,133,0.15)] px-3 py-1.5">
        <div className="grid grid-cols-4 items-center max-w-sm mx-auto">
          {mobileBottomNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-full transition-all touch-manipulation min-h-[44px]",
                  isActive ? "text-white font-bold" : "text-white/50 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-magenta-500/30 to-pink-500/25 border border-magenta-500/40 shadow-[0_0_15px_rgba(255,42,133,0.3)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative z-10">
                  <Icon size={18} className={isActive ? "text-magenta-400 drop-shadow-[0_0_8px_rgba(255,42,133,0.8)]" : ""} />
                  {link.href === "/my-list" && list.length > 0 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-magenta-500 to-pink-500 text-white text-[8px] font-black flex items-center justify-center shadow-sm z-20">
                      {list.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight relative z-10 leading-none whitespace-nowrap">
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

