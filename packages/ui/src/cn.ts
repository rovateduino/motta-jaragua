type ClassValue = string | false | null | undefined;

/** Concatena classes condicionais sem dependências externas. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
