import { MapPin } from "lucide-react";
import { getNatureStayPublicImageUrl } from "@/lib/nature-stay-images";
import type { HostPublicInfo } from "@/types/nature-stay";

interface HostPublicCardProps {
  host: HostPublicInfo;
  loading?: boolean;
}

export function HostPublicCard({ host, loading }: HostPublicCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-5">
        <div className="h-4 w-24 skeleton-shimmer rounded" />
        <div className="mt-3 flex items-center gap-3">
          <div className="h-12 w-12 skeleton-shimmer rounded-full" />
          <div className="space-y-2">
            <div className="h-4 w-32 skeleton-shimmer rounded" />
            <div className="h-3 w-24 skeleton-shimmer rounded" />
          </div>
        </div>
      </div>
    );
  }

  const profileImg = getNatureStayPublicImageUrl(host.profile_image_path);
  const location = [host.city, host.state].filter(Boolean).join(", ");

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-sand-600">
        Anfitrión
      </h3>
      <div className="mt-3 flex items-center gap-3">
        {profileImg ? (
          <img
            src={profileImg}
            alt={host.display_name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-lg font-semibold text-forest-700">
            {host.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-forest-800">{host.display_name}</p>
          {location && (
            <p className="flex items-center gap-1 text-sm text-sand-600">
              <MapPin size={12} /> {location}
            </p>
          )}
        </div>
      </div>
      {host.description && (
        <p className="mt-3 text-sm text-forest-600 line-clamp-4">{host.description}</p>
      )}
    </div>
  );
}
