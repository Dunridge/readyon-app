'use client';

import type { Balance } from '@/lib/types';
import { StalenessIndicator } from './StalenessIndicator';

interface BalanceCardProps {
  balance: Balance;
  optimisticDeductions?: number;
  isLoading?: boolean;
  isStale?: boolean;
}

export function BalanceCard({
  balance,
  optimisticDeductions = 0,
  isLoading = false,
  isStale = false,
}: BalanceCardProps) {
  const displayAvailable = Math.max(0, balance.availableDays - optimisticDeductions);
  const usagePercent = Math.round((balance.usedDays / balance.totalDays) * 100);
  const hasOptimisticDeduction = optimisticDeductions > 0;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-5 animate-pulse">
        <div className="h-3 bg-[#1f1f1f] rounded w-1/2 mb-4" />
        <div className="h-9 bg-[#1f1f1f] rounded w-1/4 mb-3" />
        <div className="h-1.5 bg-[#1f1f1f] rounded w-full mb-3" />
        <div className="h-3 bg-[#1f1f1f] rounded w-2/3" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        isStale
          ? 'border-[#3a2e00] bg-[#0f0e00]'
          : 'border-[#1f1f1f] bg-[#111]'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">{balance.locationName}</h3>
          <p className="text-xs text-[#444] mt-0.5">{balance.locationId}</p>
        </div>
        <StalenessIndicator lastUpdated={balance.lastUpdated} />
      </div>

      <div className="flex items-end gap-1.5 mb-1">
        <span className={`text-4xl font-bold tracking-tight ${hasOptimisticDeduction ? 'text-[#7eb8f7]' : 'text-white'}`}>
          {displayAvailable}
        </span>
        <span className="text-sm text-[#555] mb-1.5">/ {balance.totalDays} days</span>
      </div>

      {hasOptimisticDeduction && (
        <p className="text-xs text-[#4a7fa8] mb-3">
          {balance.availableDays} actual · {optimisticDeductions} pending
        </p>
      )}

      <div className="w-full bg-[#1a1a1a] rounded-full h-1 mb-3 mt-3">
        <div
          className="bg-white h-1 rounded-full transition-all opacity-20"
          style={{ width: `${Math.min(100, usagePercent)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-[#444]">
        <span>{balance.usedDays} used</span>
        <span>{balance.totalDays} total</span>
      </div>
    </div>
  );
}

export function BalanceCardSkeleton() {
  return (
    <BalanceCard
      isLoading
      balance={{
        employeeId: '',
        locationId: '',
        locationName: '',
        availableDays: 0,
        usedDays: 0,
        totalDays: 0,
        lastUpdated: new Date().toISOString(),
      }}
    />
  );
}
