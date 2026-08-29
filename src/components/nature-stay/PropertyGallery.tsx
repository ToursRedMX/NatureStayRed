import { useState } from "react";
import { Home } from "lucide-react";
import { getNatureStayPublicImageUrl } from "@/lib/nature-stay-images";
import type { PropertyImagePublic } from "@/types/nature-stay";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  images: PropertyImagePublic[];
  altName: string;
  loading?: boolean;
  className?: string;
}

export function PropertyGallery({ images, altName, loading, className }: PropertyGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className={cn("grid grid-cols-1 gap-3 overflow-hidden rounded-2xl md:grid-cols-2 md:rounded-3xl", className)}>
        <div className="h-72 skeleton-shimmer rounded-2xl md:h-96" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 skeleton-shimmer rounded-lg md:h-48 md:rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const sorted = [...images].sort((a, b) => {
    if (a.is_cover && !b.is_cover) return -1;
    if (!a.is_cover && b.is_cover) return 1;
    return a.sort_order - b.sort_order;
  });

  const cover = sorted[0];
  const rest = sorted.slice(1, 5);
  const hasMore = sorted.length > 5;

  const coverUrl = getNatureStayPublicImageUrl(cover?.storage_path);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  return (
    <>
      <div className={cn("grid grid-cols-1 gap-3 overflow-hidden rounded-2xl md:grid-cols-2 md:rounded-3xl", className)}>
        <button
          onClick={() => cover && openLightbox(0)}
          className="h-72 overflow-hidden rounded-2xl md:h-96"
          aria-label="Ver imagen principal"
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={cover?.alt_text || altName}
              loading="eager"
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest-100 to-forest-200">
              <Home size={48} className="text-forest-300" />
            </div>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          {rest.length > 0
            ? rest.map((img, i) => {
                const url = getNatureStayPublicImageUrl(img.storage_path);
                return (
                  <button
                    key={img.id}
                    onClick={() => openLightbox(i + 1)}
                    className="relative h-36 overflow-hidden rounded-lg md:h-48 md:rounded-xl"
                    aria-label={`Ver imagen ${i + 2}`}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={img.alt_text || ""}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-sand-100">
                        <Home size={32} className="text-sand-300" />
                      </div>
                    )}
                    {i === 3 && hasMore && (
                      <div className="absolute inset-0 flex items-center justify-center bg-forest-950/60">
                        <span className="font-display text-lg font-semibold text-white">
                          +{sorted.length - 5}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            : Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-36 items-center justify-center bg-sand-100 rounded-lg md:h-48 md:rounded-xl"
                >
                  <Home size={32} className="text-sand-300" />
                </div>
              ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-950/90 p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={closeLightbox}
            aria-label="Cerrar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <img
            src={getNatureStayPublicImageUrl(sorted[lightboxIndex]?.storage_path) || ""}
            alt={sorted[lightboxIndex]?.alt_text || altName}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
