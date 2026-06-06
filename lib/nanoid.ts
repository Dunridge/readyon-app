// Tiny unique ID generator (no external dep needed)
export function nanoid(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
