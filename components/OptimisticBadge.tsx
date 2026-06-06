'use client';

import type { OptimisticRequest } from '@/lib/types';

interface OptimisticBadgeProps {
  state: OptimisticRequest['state'];
  errorMessage?: string;
}

export function OptimisticBadge({ state, errorMessage }: OptimisticBadgeProps) {
  if (state === 'submitting') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#0d1520] text-[#7eb8f7] border border-[#1a3050]">
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Submitting
      </span>
    );
  }

  if (state === 'pending-confirmation') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#1a1500] text-[#e8b800] border border-[#3a3000]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#e8b800] animate-pulse" />
        Pending HCM
      </span>
    );
  }

  if (state === 'rolled-back') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#1a0505] text-[#f87171] border border-[#3a1010]">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        {errorMessage ? `Denied: ${errorMessage}` : 'Rolled back'}
      </span>
    );
  }

  if (state === 'verification-warning') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[#1a0f00] text-[#fb923c] border border-[#3a2000]">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Verify
      </span>
    );
  }

  return null;
}
