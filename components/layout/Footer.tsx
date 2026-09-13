import Link from "next/link";
import { Play } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-kuro-surface/50 mt-16 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-magenta-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,42,133,0.5)]">
                <Play size={14} className="fill-white text-white ml-0.5" />
              </div>
              <span className="font-display text-lg font-black text-white">
                KURO<span className="text-magenta-400">STREAM</span>
              </span>
            </Link>
            <p className="text-kuro-muted text-sm leading-relaxed">
              Your premium destination for anime streaming. Watch thousands of episodes in HD.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Navigation</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/search", label: "Browse" },
                { href: "/my-list", label: "My Vault" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-kuro-muted text-sm hover:text-magenta-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Genres</h4>
            <ul className="flex flex-col gap-2.5">
              {["Action", "Romance", "Fantasy", "Sci-Fi", "Slice of Life"].map((g) => (
                <li key={g}>
                  <Link
                    href={`/search?genre=${g}`}
                    className="text-kuro-muted text-sm hover:text-magenta-400 transition-colors"
                  >
                    {g}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Info</h4>
            <ul className="flex flex-col gap-2.5">
              {[
                "About",
                "DMCA",
                "Privacy Policy",
                "Terms of Service",
                "Contact",
              ].map((item) => (
                <li key={item}>
                  <span className="text-kuro-muted text-sm cursor-default">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal */}
        <div className="border-t border-white/10 pt-8">
          <p className="text-kuro-muted text-xs leading-relaxed mb-3">
            <strong className="text-white">Legal Disclaimer:</strong> KuroStream does not
            host, store, or distribute any video content. All video streams are sourced from
            third-party providers via publicly accessible APIs. KuroStream is not responsible for
            the content served by external sources. This website is for educational and personal
            use only. If you are a copyright holder and wish to report an infringement, please
            contact us directly.
          </p>
          <p className="text-kuro-muted text-xs">
            © {new Date().getFullYear()} KuroStream. All rights reserved. Anime metadata provided
            by{" "}
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-magenta-400 font-semibold hover:underline"
            >
              AniList
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
