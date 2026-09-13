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
  { href: "/suggestions", label: "AI Match", icon: Sparkles },
  { href: "/my-list", label: "Vault", icon: Bookmark },
];

const mobileBottomNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Discover", icon: Compass },
  { href: "/manga", label: "Manga", icon: BookOpen },
  { href: "/suggestions", label: "AI Match", icon: Sparkles },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { list } = useMyList();
  const { open: openCommandPalette } = useCommandPalette();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Floating Island Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3 transition-all duration-300">
        <div
          className={cn(
            "max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-5 py-2.5 rounded-2xl transition-all duration-300",
            scrolled
              ? "glass-island shadow-2xl border border-white/10"
              : "bg-black/50 backdrop-blur-xl border border-white/5 shadow-lg"
          )}
        >
          {/* Brand Logo - Minimal & Sleek */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-magenta-500 to-pink-500 text-white flex items-center justify-center font-black text-sm shadow-[0_0_20px_rgba(255,42,133,0.4)] group-hover:scale-105 transition-transform">
              K
            </div>

            <span className="font-display text-lg font-black tracking-tight select-none">
              <span className="text-magenta-400">KURO</span>
              <span className="text-white">STREAM</span>
            </span>
          </Link>

          {/* Desktop Nav - Clean & Aesthetic */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] p-1 rounded-xl backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 select-none",
                    isActive
                      ? "text-white font-bold"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-lg bg-magenta-500/20 border border-magenta-500/40 shadow-[0_0_15px_rgba(255,42,133,0.25)]"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <Icon size={14} className={isActive ? "text-magenta-400 relative z-10" : "relative z-10"} />
                  <span className="relative z-10">{link.label}</span>

                  {link.href === "/my-list" && list.length > 0 && (
                    <span className="relative z-10 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-magenta-500 text-white shadow-sm ml-0.5">
                      {list.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Clean Quick Search */}
          <div className="flex items-center gap-2">
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white/70 hover:text-white transition-all group"
              aria-label="Search"
            >
              <Search size={14} className="group-hover:text-magenta-400 transition-colors" />
              <span className="hidden sm:inline font-medium text-white/60 group-hover:text-white">Quick search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60 border border-white/10">
                <Command size={10} /> K
              </kbd>
            </button>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-white/70 hover:text-white bg-white/[0.04] border border-white/[0.08] transition-all"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
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
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md md:hidden"
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-72 z-50 bg-kuro-surface border-l border-kuro-border md:hidden flex flex-col pt-20 px-6 gap-3"
            >
              <div className="flex flex-col gap-1.5">
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
                          ? "bg-magenta-500/15 text-white border border-magenta-500/30"
                          : "text-kuro-text-dim hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className={isActive ? "text-magenta-400" : ""} />
                        <span>{link.label}</span>
                      </div>
                      {link.href === "/my-list" && list.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-magenta-500 text-white font-bold">
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

      {/* Floating Bottom Navigation for Mobile (Clean 4 Core Destinations) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden glass-island border-t border-white/10 shadow-2xl px-3 pb-safe pt-2">
        <div className="grid grid-cols-4 items-center max-w-sm mx-auto">
          {mobileBottomNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-xl transition-all touch-manipulation min-h-[44px]",
                  isActive ? "text-white font-bold" : "text-kuro-muted hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-pill"
                    className="absolute inset-0 rounded-xl bg-magenta-500/25 border border-magenta-500/40"
                  />
                )}
                <Icon size={19} className={isActive ? "text-magenta-400 relative z-10" : "relative z-10"} />
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
