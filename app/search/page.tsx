import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata = {
  title: "Browse Anime - KuroStream",
  description: "Search and discover anime by title, genre, year, and more on KuroStream.",
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
