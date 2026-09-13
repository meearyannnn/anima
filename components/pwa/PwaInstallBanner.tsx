"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share, PlusSquare, X, Sparkles, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosTutorial, setShowIosTutorial] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone PWA
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Check if user dismissed recently (wait 5 days before showing again)
    const dismissedAt = localStorage.getItem("kuro_pwa_dismissed");
    if (dismissedAt) {
      const daysPassed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 5) return;
    }

    // Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Anima Stream SW registered"))
        .catch((err) => console.warn("SW registration error:", err));
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for Chromium install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Delay showing banner by 4 seconds so it doesn't interrupt first impression
      setTimeout(() => setShowBanner(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If iOS Safari and not standalone, show after a short delay
    if (isIosDevice) {
      const timer = setTimeout(() => setShowBanner(true), 5000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosTutorial(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosTutorial(false);
    localStorage.setItem("kuro_pwa_dismissed", Date.now().toString());
  };

  if (isStandalone || !showBanner) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative rounded-2xl bg-kuro-card/95 backdrop-blur-2xl border border-white/15 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(255,42,133,0.15)] overflow-hidden"
        >
          {/* Top Neon Accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-kuro-magenta to-transparent" />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-lg text-kuro-lavender/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {!showIosTutorial ? (
            <div className="flex items-start gap-3.5 pr-6">
              {/* App Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-kuro-magenta to-purple-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-kuro-magenta/30 shrink-0 select-none">
                A
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-extrabold text-white">Install Anima Stream</h4>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-kuro-magenta/20 text-kuro-magenta border border-kuro-magenta/30">
                    App
                  </span>
                </div>
                <p className="text-xs text-kuro-lavender/70 leading-relaxed">
                  Get the standalone full-screen app for instant access and zero browser clutter.
                </p>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleInstallClick}
                    className="text-xs py-1.5 px-3.5 shadow-md shadow-kuro-magenta/20"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {isIos ? "Install on iPhone" : "Install App"}
                  </Button>
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-kuro-lavender/60 hover:text-white px-2 py-1 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* iOS Safari Step-by-Step Tutorial */
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-kuro-magenta" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Install on iPhone / iPad
                </h4>
              </div>

              <div className="space-y-2 text-xs text-kuro-lavender/80">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white">
                    <Share className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span>
                    1. Tap the <strong className="text-white">Share button</strong> in Safari's bottom toolbar.
                  </span>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white">
                    <PlusSquare className="w-3.5 h-3.5 text-kuro-magenta" />
                  </div>
                  <span>
                    2. Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>.
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDismiss}
                className="w-full justify-center text-xs py-1.5"
              >
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Got it!
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
