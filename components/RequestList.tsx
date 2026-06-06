'use client';

import type { TimeOffRequest } from '@/lib/types';
import type { OptimisticRequest } from '@/lib/types';
import { OptimisticBadge } from './OptimisticBadge';

interface RequestListProps {
  requests: TimeOffRequest[];
  optimisticRequests?: OptimisticRequest[];
  isLoading?: boolean;
  isEmpty?: boolean;
}

const STATUS_STYLES: Record<TimeOffRequest['status'], string> = {
  pending: 'bg-[#1a1500] text-[#e8b800] border border-[#3a3000]',
  approved: 'bg-[#001a0a] text-[#4ade80] border border-[#003a14]',
  denied: 'bg-[#1a0505] text-[#f87171] border border-[#3a1010]',
  cancelled: 'bg-[#141414] text-[#555] border border-[#2a2a2a]',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function RequestList({
  requests,
  optimisticRequests = [],
  isLoading = false,
  isEmpty = false,
}: RequestListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-[#1f1f1f] bg-[#111] h-16" />
        ))}
      </div>
    );
  }

  const pendingOptimistic = optimisticRequests.filter((r) => r.state !== 'rolled-back');

  if (isEmpty && pendingOptimistic.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#2a2a2a] p-12 text-center">
        <p className="text-[#444] text-sm">No requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pendingOptimistic.map((opt) => (
        <div
          key={opt.localId}
          className="rounded-lg border border-[#1a2a3a] bg-[#0a1520] px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">
                {opt.daysRequested} day{opt.daysRequested !== 1 ? 's' : ''} · {opt.locationId}
              </p>
              <p className="text-xs text-[#444] mt-0.5">Just now</p>
            </div>
            <OptimisticBadge state={opt.state} errorMessage={opt.errorMessage} />
          </div>
        </div>
      ))}

      {requests.map((req) => (
        <div key={req.id} className="rounded-lg border border-[#1f1f1f] bg-[#111] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-white">
                  {req.daysRequested} day{req.daysRequested !== 1 ? 's' : ''}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[req.status]}`}>
                  {req.status}
                </span>
              </div>
              <p className="text-xs text-[#555] mt-0.5 truncate">
                {formatDate(req.startDate)} – {formatDate(req.endDate)}
                {req.reason && <span className="text-[#444]"> · {req.reason}</span>}
              </p>
            </div>
            <span className="text-xs text-[#333] flex-shrink-0">{req.locationId}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
