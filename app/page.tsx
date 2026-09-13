import { Suspense } from "react";
import { HeroBanner } from "@/components/anime/HeroBanner";
import { HeroBannerSkeleton } from "@/components/ui/Skeleton";
import { HomeClient } from "./HomeClient";
import { getTrending, getSeasonalAnime, getTopAnime, getCurrentSeason } from "@/lib/api/anilist";

export default async function HomePage() {
  const { season, year } = getCurrentSeason();

  // Parallel fetch on the server
  const [trendingData, seasonalData, topData] = await Promise.allSettled([
    getTrending(1, 20),
    getSeasonalAnime(season, year, 1, 18),
    getTopAnime(10),
  ]);

  const trending =
    trendingData.status === "fulfilled" ? trendingData.value.Page.media : [];
  const seasonal =
    seasonalData.status === "fulfilled" ? seasonalData.value.Page.media : [];
  const top = topData.status === "fulfilled" ? topData.value.Page.media : [];

  const heroList = trending.slice(0, 8);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <Suspense fallback={<HeroBannerSkeleton />}>
        {heroList.length > 0 && <HeroBanner animeList={heroList} anime={heroList[0]} />}
      </Suspense>

      {/* Client sections (Continue Watching needs localStorage) */}
      <HomeClient trending={trending} seasonal={seasonal} top={top} />
    </div>
  );
}
