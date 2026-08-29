const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function getNatureStayPublicImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;

  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }

  const cleanPath = storagePath.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/public/${cleanPath}`;
}
