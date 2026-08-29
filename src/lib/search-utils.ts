const MAX_LENGTH = 100;

export function sanitizeSearchText(input: string | undefined | null): string {
  if (!input) return "";
  const trimmed = input.trim().slice(0, MAX_LENGTH);
  return trimmed;
}

export function buildPostgrestOrFilter(
  fields: string[],
  value: string
): string | null {
  const sanitized = sanitizeSearchText(value);
  if (!sanitized) return null;

  const escaped = sanitized
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/%/g, "\\%")
    .replace(/\./g, "\\.");

  return fields.map((f) => `${f}.ilike.%${escaped}%`).join(",");
}
