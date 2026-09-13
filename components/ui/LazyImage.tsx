"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface LazyImageProps extends Omit<ImageProps, "onLoad"> {
  fallbackSrc?: string;
  showLoaderGraphic?: boolean;
}

export function LazyImage({
  src,
  alt,
  className,
  fallbackSrc = "/loader.png",
  showLoaderGraphic = false,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const finalSrc = error ? fallbackSrc : src;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Saitama Lazy Loader Graphic / Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-white/[0.03] flex items-center justify-center backdrop-blur-xs z-10">
          {showLoaderGraphic ? (
            <div className="animate-pulse opacity-40">
              <Image
                src="/loader.png"
                alt="Loading..."
                width={38}
                height={44}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-full shimmer" />
          )}
        </div>
      )}

      {/* Actual Optimized Image with smooth fade-in */}
      <Image
        src={finalSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        {...props}
      />
    </div>
  );
}
