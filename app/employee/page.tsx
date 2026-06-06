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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 mb-1 block">
              ← Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">My Time Off</h1>
            <p className="text-sm text-gray-500">Alice Johnson · emp-001</p>
          </div>
          <div className="flex items-center gap-3">
            {balancesFetching && (
              <span className="text-xs text-gray-400 animate-pulse">Refreshing...</span>
            )}
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              {showForm ? 'Cancel' : '+ New Request'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Verification warning banner */}
        <VerificationWarningBanner
          count={verificationWarningCount}
          onRefresh={handleRefresh}
        />

        {/* Balances */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Leave Balances</h2>
            {balancesUpdatedAt > 0 && (
              <span className="text-xs text-gray-400">
                Last updated {new Date(balancesUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {balancesLoading
              ? [1, 2].map((i) => <BalanceCardSkeleton key={i} />)
              : balances?.map((balance) => (
                  <BalanceCard
                    key={balance.locationId}
                    balance={balance}
                    optimisticDeductions={getOptimisticDeductions(
                      EMPLOYEE_ID,
                      balance.locationId
                    )}
                    isStale={
                      balancesUpdatedAt > 0 &&
                      Date.now() - balancesUpdatedAt > 2 * 60 * 1000
                    }
                  />
                ))}
          </div>
        </section>

        {/* Request form */}
        {showForm && balances && balances.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-4">New Time-Off Request</h2>
            <RequestForm
              employeeId={EMPLOYEE_ID}
              balances={balances}
              onSuccess={() => setShowForm(false)}
            />
          </section>
        )}

        {/* Requests */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-4">My Requests</h2>
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
