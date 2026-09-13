import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata = {
  title: "Discover & AI Match - Anima Stream",
  description: "Explore curated anime, trending releases, and AI-powered recommendations on Anima Stream.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-kuro-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
