# KuroStream — Premium Anime Streaming Web App 🎌

KuroStream is a modern, high-performance anime streaming platform built with **Next.js 14/16 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. It features a custom **HLS.js** video player with auto-skip intro/outro, episode sidebar, local watch history, and AniList GraphQL synchronization.

---

## ✨ Features

- **Cinematic Dark UI:** Deep obsidian palette (`#0a0a0f`), vibrant purple neon accents, glowing badges, and smooth glassmorphism effects.
- **Hero Carousel & Trending Rails:** Dynamic banner featuring top seasonal anime with instant playback and synopsis preview.
- **Custom HLS.js Video Player:**
  - Auto-hiding sleek control bar on idle.
  - Multi-server switching (Default, Cloud, Stream, Rapid).
  - Sub / Dub audio/subtitle track toggling.
  - Quality selection (1080p, 720p, 480p, 360p, Auto).
  - **AniSkip Integration:** One-click animated slide-in buttons to skip OP (Opening) and ED (Ending).
  - **Auto-Next Episode:** Interactive countdown prompt when an episode finishes.
  - Keyboard navigation: Space/K (Play/Pause), J/L (Rewind/Fast-forward 10s), F (Fullscreen), M (Mute), Up/Down (Volume).
- **Search & Advanced Filtering:**
  - Instant debounced search.
  - Filter by Genre, Format (TV, Movie, OVA, Special), Status (Airing, Finished, Upcoming), and Release Year.
- **Personal Watchlist & History (Zustand + LocalStorage):**
  - "My List" bookmarks with one-click add/remove.
  - Auto-saving watch progress timestamp with "Continue Watching" row on the home page.
- **Mobile Responsive:** Floating mobile bottom navigation bar and gesture-ready drawer.

---

## 🛠️ Architecture & Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + Custom CSS Variables + Fontshare Satoshi & Inter
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Video Engine:** HLS.js (`hls.js`)
- **State Management:** Zustand with `persist` middleware
- **Data Caching:** TanStack Query (`@tanstack/react-query`)
- **APIs:**
  - **Metadata:** AniList GraphQL API (`https://graphql.anilist.co`)
  - **Stream Sources:** AllAnime API (`https://allanime-api.rk18109ry.workers.dev`)
  - **Timestamps:** AniSkip API (`https://api.aniskip.com/v2/skip-times`)
  - **Fallback Data:** Jikan REST API v4 (`https://api.jikan.moe/v4`)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run start
```

---

## 🌐 API Proxy & Cloudflare Worker

KuroStream includes a built-in Next.js server route at `/api/proxy` to circumvent browser CORS restrictions when fetching m3u8 streams and episode manifests.

If you prefer to host your own dedicated CORS proxy on **Cloudflare Workers**, deploy the following worker script:

```javascript
// Cloudflare Worker: cors-proxy.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response("Missing 'url' query parameter", { status: 400 });
    }

    // Forward the request to the upstream target
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    modifiedHeaders.set("Referer", "https://allanime.to");
    modifiedHeaders.delete("host");

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: modifiedHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      });

      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "*");

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: responseHeaders });
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response("Proxy Error: " + err.message, { status: 502 });
    }
  },
};
```

---

## 📁 Project Structure

```
├── app/
│   ├── anime/[id]/            # Anime details page & episode selector
│   ├── api/proxy/             # Next.js streaming CORS reverse proxy
│   ├── my-list/               # Bookmarked anime list
│   ├── search/                # Live filter & search page
│   ├── watch/[animeId]/[ep]/  # Video player screen with episode sidebar
│   ├── layout.tsx             # Root layout with QueryProvider & Navbar
│   ├── page.tsx               # Home landing with Hero & Rows
│   └── globals.css            # Dark theme tokens & shimmer effects
├── components/
│   ├── anime/                 # AnimeCard, HeroBanner, TrendingRow, EpisodeCard
│   ├── layout/                # Navbar (with mobile bottom nav), Footer
│   ├── player/                # VideoPlayer (HLS.js), Controls, SkipButton
│   ├── providers/             # TanStack Query client provider
│   └── ui/                    # Button, Skeleton, Toast notifications
├── lib/
│   ├── api/                   # AniList, AllAnime, AniSkip, Jikan clients
│   ├── store/                 # Zustand stores (useWatchHistory, useMyList, useToast)
│   ├── types.ts               # Core TypeScript definitions
│   └── utils.ts               # Helper utilities & class merging
```

---

## 🚢 Deployment to Vercel

1. Push your code to a GitHub repository.
2. Import the project into [Vercel](https://vercel.com).
3. Framework Preset will be automatically detected as **Next.js**.
4. Click **Deploy**. No additional environment variables are mandatory for baseline usage!
