'use client';

interface VerificationWarningBannerProps {
  count: number;
  onRefresh?: () => void;
}

export function VerificationWarningBanner({ count, onRefresh }: VerificationWarningBannerProps) {
  if (count === 0) return null;

  return (
    <div className="rounded-xl border border-[#3a2000] bg-[#0f0800] px-5 py-4 flex items-start gap-3">
      <svg className="w-4 h-4 text-[#fb923c] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-[#fb923c]">Balance verification needed</h3>
        <p className="text-sm text-[#8a5a2a] mt-1">
          {count === 1 ? '1 request' : `${count} requests`} could not be confirmed with the HR system.
          Your balance may not reflect actual HCM state.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-2 text-xs font-medium text-[#fb923c] hover:text-[#fdba74] underline transition-colors"
          >
            Refresh balances
          </button>
        )}
      </div>
    </div>
  );
}
