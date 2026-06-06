'use client';

import { useState } from 'react';
import type { TimeOffRequest, Balance } from '@/lib/types';
import { StalenessIndicator } from './StalenessIndicator';

interface ManagerRequestCardProps {
  request: TimeOffRequest;
  employeeName?: string;
  balance?: Balance;
  balanceIsLoading?: boolean;
  balanceFetchedAt?: number; // timestamp
  onApprove: (requestId: string) => Promise<void>;
  onDeny: (requestId: string) => Promise<void>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ManagerRequestCard({
  request,
  employeeName,
  balance,
  balanceIsLoading = false,
  balanceFetchedAt,
  onApprove,
  onDeny,
}: ManagerRequestCardProps) {
  const [actionState, setActionState] = useState<'idle' | 'approving' | 'denying' | 'done' | 'error'>('idle');
  const [actionError, setActionError] = useState('');

  const isDataStale =
    balanceFetchedAt != null && Date.now() - balanceFetchedAt > 2 * 60 * 1000;

  const hasSufficientBalance = balance
    ? balance.availableDays >= request.daysRequested
    : null;

  const handleApprove = async () => {
    setActionState('approving');
    setActionError('');
    try {
      await onApprove(request.id);
      setActionState('done');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval failed');
      setActionState('error');
    }
  };

  const handleDeny = async () => {
    setActionState('denying');
    setActionError('');
    try {
      await onDeny(request.id);
      setActionState('done');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Denial failed');
      setActionState('error');
    }
  };

  if (actionState === 'done') {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-60">
        <p className="text-sm text-gray-500 text-center">Action completed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {employeeName ?? request.employeeId}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(request.startDate)} – {formatDate(request.endDate)} ·{' '}
            <span className="font-medium text-gray-700">{request.daysRequested} day(s)</span>
          </p>
          {request.reason && (
            <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{request.reason}&rdquo;</p>
          )}
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
          Pending
        </span>
      </div>

      {/* Balance context */}
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">Employee Balance</span>
          {balanceFetchedAt && (
            <StalenessIndicator
              lastUpdated={new Date(balanceFetchedAt).toISOString()}
              staleThresholdMs={2 * 60 * 1000}
            />
          )}
        </div>
        {balanceIsLoading ? (
          <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2" />
        ) : balance ? (
          <div className="flex items-center gap-3">
            <span
              className={`text-lg font-bold ${
                hasSufficientBalance ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {balance.availableDays} days available
            </span>
            <span className="text-xs text-gray-400">
              ({balance.usedDays} used / {balance.totalDays} total)
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-400">Balance data unavailable</p>
        )}

        {hasSufficientBalance === false && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            Warning: Insufficient balance for this request.
          </p>
        )}

        {isDataStale && (
          <p className="mt-1.5 text-xs text-amber-600">
            Balance data may be outdated. Consider refreshing before deciding.
          </p>
        )}
      </div>

      {/* Error */}
      {actionState === 'error' && actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={actionState === 'approving' || actionState === 'denying'}
          className="flex-1 rounded-lg bg-green-600 text-white py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {actionState === 'approving' ? 'Approving...' : 'Approve'}
        </button>
        <button
          onClick={handleDeny}
          disabled={actionState === 'approving' || actionState === 'denying'}
          className="flex-1 rounded-lg border border-red-300 text-red-700 py-2 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {actionState === 'denying' ? 'Denying...' : 'Deny'}
        </button>
      </div>
    </div>
  );
}
