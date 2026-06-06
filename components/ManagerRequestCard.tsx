'use client';

import { useState } from 'react';
import type { TimeOffRequest, Balance } from '@/lib/types';
import { StalenessIndicator } from './StalenessIndicator';

interface ManagerRequestCardProps {
  request: TimeOffRequest;
  employeeName?: string;
  balance?: Balance;
  balanceIsLoading?: boolean;
  balanceFetchedAt?: number;
  onApprove: (requestId: string) => Promise<void>;
  onDeny: (requestId: string) => Promise<void>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const isDataStale = balanceFetchedAt != null && Date.now() - balanceFetchedAt > 2 * 60 * 1000;
  const hasSufficientBalance = balance ? balance.availableDays >= request.daysRequested : null;

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
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-5 opacity-40">
        <p className="text-sm text-[#555] text-center">Action recorded.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {employeeName ?? request.employeeId}
          </h3>
          <p className="text-xs text-[#555] mt-0.5">
            {formatDate(request.startDate)} – {formatDate(request.endDate)}
            {' · '}
            <span className="text-[#888]">{request.daysRequested} day{request.daysRequested !== 1 ? 's' : ''}</span>
          </p>
          {request.reason && (
            <p className="text-xs text-[#444] mt-1 italic">&ldquo;{request.reason}&rdquo;</p>
          )}
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1a1500] text-[#e8b800] border border-[#3a3000] flex-shrink-0">
          Pending
        </span>
      </div>

      {/* Balance context */}
      <div className="rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#555] uppercase tracking-wide">Employee Balance</span>
          {balanceFetchedAt && (
            <StalenessIndicator
              lastUpdated={new Date(balanceFetchedAt).toISOString()}
              staleThresholdMs={2 * 60 * 1000}
            />
          )}
        </div>
        {balanceIsLoading ? (
          <div className="animate-pulse h-4 bg-[#1f1f1f] rounded w-1/2" />
        ) : balance ? (
          <div className="flex items-center gap-3">
            <span className={`text-xl font-bold ${hasSufficientBalance ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              {balance.availableDays} days
            </span>
            <span className="text-xs text-[#444]">
              {balance.usedDays} used / {balance.totalDays} total
            </span>
          </div>
        ) : (
          <p className="text-xs text-[#444]">Balance unavailable</p>
        )}

        {hasSufficientBalance === false && (
          <p className="mt-1.5 text-xs text-[#f87171]">
            Insufficient balance for this request.
          </p>
        )}

        {isDataStale && (
          <p className="mt-1.5 text-xs text-[#b8860b]">
            Balance data may be stale. Consider refreshing before deciding.
          </p>
        )}
      </div>

      {actionState === 'error' && actionError && (
        <div className="rounded-lg bg-[#1a0505] border border-[#3a1010] px-3 py-2 text-xs text-[#f87171]">
          {actionError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={actionState === 'approving' || actionState === 'denying'}
          className="flex-1 rounded-lg bg-white text-black py-2 text-sm font-semibold hover:bg-[#e8e8e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {actionState === 'approving' ? 'Approving...' : 'Approve'}
        </button>
        <button
          onClick={handleDeny}
          disabled={actionState === 'approving' || actionState === 'denying'}
          className="flex-1 rounded-lg bg-[#1a0505] border border-[#3a1010] text-[#f87171] py-2 text-sm font-semibold hover:bg-[#200808] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {actionState === 'denying' ? 'Denying...' : 'Deny'}
        </button>
      </div>
    </div>
  );
}
