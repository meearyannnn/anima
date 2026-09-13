import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({ className, rounded = "md", ...props }: SkeletonProps) {
  const radiusMap = {
    sm: "rounded",
    md: "rounded-xl",
    lg: "rounded-2xl",
    full: "rounded-full",
  };

  return (
    <div
      className={cn(
        "bg-kuro-surface shimmer",
        radiusMap[rounded],
        className
      )}
      {...props}
    />
  );
}

export function AnimeCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="w-full aspect-[2/3]" rounded="lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function HeroBannerSkeleton() {
  return (
    <div className="relative w-full h-[85vh] bg-kuro-surface">
      <Skeleton className="w-full h-full" rounded="sm" />
      <div className="absolute bottom-24 left-16 flex flex-col gap-4">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-3 mt-4">
          <Skeleton className="h-12 w-36" rounded="full" />
          <Skeleton className="h-12 w-36" rounded="full" />
        </div>
      </div>
    </div>
  );
}
