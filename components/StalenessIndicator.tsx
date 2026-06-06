'use client';

interface StalenessIndicatorProps {
  lastUpdated: string; // ISO timestamp
  staleThresholdMs?: number;
}

export function StalenessIndicator({
  lastUpdated,
  staleThresholdMs = 2 * 60 * 1000, // 2 minutes
}: StalenessIndicatorProps) {
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  const isStale = ageMs > staleThresholdMs;

  if (!isStale) return null;

  const minutes = Math.floor(ageMs / 60_000);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      Data {minutes}m old
    </span>
  );
}
