import type { Metadata } from "next";
import { SuggestionsClient } from "./SuggestionsClient";

export const metadata: Metadata = {
  title: "KuroAI Neural Suggestions — Smart Anime Discovery",
  description:
    "Intelligent anime recommendations powered by real-time taste genome analysis, vibe prompts, and smart roulette.",
};

export default function SuggestionsPage() {
  return <SuggestionsClient />;
}
