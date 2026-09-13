import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnimeById } from "@/lib/api/anilist";
import { AnimeDetailClient } from "./AnimeDetailClient";
import { getAnimeTitle, stripHtml } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id);
  if (isNaN(numId)) return {};

  try {
    const data = await getAnimeById(numId);
    const anime = data.Media;
    const title = getAnimeTitle(anime.title);
    const description = anime.description
      ? stripHtml(anime.description).slice(0, 160)
      : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: anime.bannerImage
          ? [{ url: anime.bannerImage }]
          : anime.coverImage?.large
          ? [{ url: anime.coverImage.large }]
          : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function AnimeDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = parseInt(id);

  if (isNaN(numId)) notFound();

  let anime;
  try {
    const data = await getAnimeById(numId);
    anime = data.Media;
  } catch {
    notFound();
  }

  return <AnimeDetailClient anime={anime} />;
}
