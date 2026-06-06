'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEmployeeBalances } from '@/hooks/useBalances';
import { useEmployeeRequests } from '@/hooks/useRequests';
import { useOptimisticStore } from '@/store/optimistic-store';
import { BalanceCard, BalanceCardSkeleton } from '@/components/BalanceCard';
import { RequestForm } from '@/components/RequestForm';
import { RequestList } from '@/components/RequestList';
import { VerificationWarningBanner } from '@/components/VerificationWarningBanner';
import { useQueryClient } from '@tanstack/react-query';
import { balanceKeys } from '@/hooks/useBalances';

const EMPLOYEE_ID = 'emp-001';

export default function EmployeePage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: balances,
    isLoading: balancesLoading,
    isFetching: balancesFetching,
    dataUpdatedAt: balancesUpdatedAt,
  } = useEmployeeBalances(EMPLOYEE_ID);

  const {
    data: requests,
    isLoading: requestsLoading,
  } = useEmployeeRequests(EMPLOYEE_ID);

  const optimisticRequests = useOptimisticStore((s) => s.requests).filter(
    (r) => r.employeeId === EMPLOYEE_ID
  );
  const getOptimisticDeductions = useOptimisticStore((s) => s.getOptimisticDeductions);

  const verificationWarningCount = optimisticRequests.filter(
    (r) => r.state === 'verification-warning'
  ).length;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: balanceKeys.byEmployee(EMPLOYEE_ID) });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#1f1f1f] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#555] hover:text-[#888] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">My Time Off</h1>
              <p className="text-xs text-[#555] mt-0.5">Alice Johnson · emp-001</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {balancesFetching && (
              <span className="text-xs text-[#444] animate-pulse">Syncing...</span>
            )}
            <button
              onClick={() => setShowForm((v) => !v)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                showForm
                  ? 'bg-[#1c1c1c] border border-[#2a2a2a] text-[#888] hover:text-white'
                  : 'bg-white text-black hover:bg-[#e8e8e8]'
              }`}
            >
              {showForm ? 'Cancel' : '+ Request'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <VerificationWarningBanner
          count={verificationWarningCount}
          onRefresh={handleRefresh}
        />

        {/* Balances */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider">Leave Balances</h2>
            {balancesUpdatedAt > 0 && (
              <span className="text-xs text-[#444]">
                Updated {new Date(balancesUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {balancesLoading
              ? [1, 2].map((i) => <BalanceCardSkeleton key={i} />)
              : balances?.map((balance) => (
                  <BalanceCard
                    key={balance.locationId}
                    balance={balance}
                    optimisticDeductions={getOptimisticDeductions(EMPLOYEE_ID, balance.locationId)}
                    isStale={balancesUpdatedAt > 0 && Date.now() - balancesUpdatedAt > 2 * 60 * 1000}
                  />
                ))}
          </div>
        </section>

        {/* Request form */}
        {showForm && balances && balances.length > 0 && (
          <section className="bg-[#111] rounded-xl border border-[#222] p-6">
            <h2 className="text-sm font-medium text-white mb-5">New Request</h2>
            <RequestForm
              employeeId={EMPLOYEE_ID}
              balances={balances}
              onSuccess={() => setShowForm(false)}
            />
          </section>
        )}

        {/* Requests */}
        <section>
          <h2 className="text-sm font-medium text-[#888] uppercase tracking-wider mb-4">Request History</h2>
          <RequestList
            requests={requests ?? []}
            optimisticRequests={optimisticRequests}
            isLoading={requestsLoading}
            isEmpty={!requests?.length}
          />
        </section>
      </main>
    </div>
  );
}
