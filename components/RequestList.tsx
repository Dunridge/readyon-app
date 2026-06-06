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
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
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
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const pendingOptimistic = optimisticRequests.filter(
    (r) => r.state !== 'rolled-back'
  );

  if (isEmpty && pendingOptimistic.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-sm">No time-off requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Optimistic (in-flight) requests */}
      {pendingOptimistic.map((opt) => (
        <div
          key={opt.localId}
          className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 opacity-80"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {opt.daysRequested} day(s) — {opt.locationId}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Submitted just now
              </p>
            </div>
            <OptimisticBadge state={opt.state} errorMessage={opt.errorMessage} />
          </div>
        </div>
      ))}

      {/* Real server requests */}
      {requests.map((req) => (
        <div
          key={req.id}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-800">
                  {req.daysRequested} day(s)
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[req.status]}`}
                >
                  {req.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(req.startDate)} – {formatDate(req.endDate)}
                {req.reason && <span className="ml-2 text-gray-400">· {req.reason}</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Location: {req.locationId} · Submitted {formatDate(req.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
