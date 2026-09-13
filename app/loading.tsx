import { SaitamaLoader } from "@/components/ui/SaitamaLoader";

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center pt-20 px-4">
      <SaitamaLoader size="lg" text="Loading stream..." />
    </div>
  );
}
