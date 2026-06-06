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
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-2" />
        <div className="h-2 bg-gray-200 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition-all ${
        isStale ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{balance.locationName}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Location ID: {balance.locationId}</p>
        </div>
        <StalenessIndicator lastUpdated={balance.lastUpdated} />
      </div>

      {/* Main balance display */}
      <div className="flex items-end gap-1 mb-1">
        <span
          className={`text-3xl font-bold ${
            hasOptimisticDeduction ? 'text-blue-600' : 'text-gray-900'
          }`}
        >
          {displayAvailable}
        </span>
        <span className="text-sm text-gray-500 mb-1">/ {balance.totalDays} days available</span>
      </div>

      {hasOptimisticDeduction && (
        <p className="text-xs text-blue-600 mb-2">
          ({balance.availableDays} actual — {optimisticDeductions} pending deduction)
        </p>
      )}

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(100, usagePercent)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{balance.usedDays} used</span>
        <span>{balance.totalDays} total</span>
      </div>
    </div>
  );
}

// Loading skeleton export for convenience
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
