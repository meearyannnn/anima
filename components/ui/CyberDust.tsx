"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export function CyberDust() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 30 });

  useEffect(() => {
    // Generate deterministic particles on client mount to avoid SSR hydration mismatches
    const generated: Particle[] = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 1.2,
      duration: Math.random() * 9 + 8,
      delay: Math.random() * 6,
      color: i % 3 === 0 ? "rgba(255, 42, 133, 0.75)" : "rgba(255, 255, 255, 0.65)",
    }));
    setParticles(generated);

    // Passive mouse tracking for smooth ambient spotlight
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setCursorPos({
            x: (e.clientX / window.innerWidth) * 100,
            y: (e.clientY / window.innerHeight) * 100,
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* ─── Cursor Neon Spotlight ───────────────────────────────────── */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out"
        style={{
          background: `radial-gradient(650px circle at ${cursorPos.x}% ${cursorPos.y}%, rgba(255, 42, 133, 0.08), transparent 75%)`,
        }}
      />

      {/* ─── Cyber Dust Particle Field ───────────────────────────────── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none animate-pulse"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0.45,
          }}
        />
      ))}
    </div>
  );
}
