import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnimeById } from "@/lib/api/anilist";
import { getTmdbTvDetails } from "@/lib/api/tmdb";
import { WatchClient } from "./WatchClient";
import { getAnimeTitle } from "@/lib/utils";
import type { AniListMedia } from "@/lib/types";

interface Props {
  params: Promise<{ animeId: string; episode: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { animeId, episode } = await params;
  const numId = parseInt(animeId);
  if (isNaN(numId)) return {};

  try {
    const data = await getAnimeById(numId);
    const title = getAnimeTitle(data.Media.title);
    return {
      title: `${title} — Episode ${episode}`,
      description: `Watch ${title} Episode ${episode} on Anima Stream`,
    };
  } catch {
    const tmdbData = await getTmdbTvDetails(numId);
    if (tmdbData) {
      return {
        title: `${tmdbData.name} — Episode ${episode}`,
        description: `Watch ${tmdbData.name} Episode ${episode} on Anima Stream`,
      };
    }
    return {};
  }
}

export default async function WatchPage({ params }: Props) {
  const { animeId, episode } = await params;
  const numId = parseInt(animeId);
  const numEp = parseInt(episode);

  if (isNaN(numId) || isNaN(numEp) || numEp < 1) notFound();

  let anime: AniListMedia | null = null;
  try {
    const data = await getAnimeById(numId);
    anime = data.Media;
  } catch {
    // Check if animeId was a TMDB ID
    const tmdbData = await getTmdbTvDetails(numId);
    if (tmdbData) {
      anime = {
        id: tmdbData.id,
        idMal: null,
        title: {
          romaji: tmdbData.name,
          english: tmdbData.name,
          native: tmdbData.name,
        },
        description: tmdbData.overview,
        coverImage: {
          extraLarge: tmdbData.poster_path
            ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
            : "",
          large: tmdbData.poster_path
            ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
            : "",
          color: "#8b5cf6",
        },
        bannerImage: tmdbData.backdrop_path
          ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
          : null,
        episodes: tmdbData.number_of_episodes || null,
        format: "TV",
        status: "RELEASING",
        genres: ["Animation", "Action", "Fantasy"],
        duration: null,
        seasonYear: null,
        season: null,
        averageScore: null,
        popularity: 1000,
        startDate: { year: null, month: null, day: null },
        trailer: null,
        rankings: [],
        studios: { nodes: [] },
        recommendations: { nodes: [] },
      };
    }
  }

  if (!anime) notFound();

  return <WatchClient anime={anime} episode={numEp} />;
}
