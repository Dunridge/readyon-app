'use client';

import Link from 'next/link';
import { usePendingRequests } from '@/hooks/useRequests';
import { useBalance } from '@/hooks/useBalances';
import { useManagerActionMutation } from '@/hooks/useTimeOffMutation';
import { ManagerRequestCard } from '@/components/ManagerRequestCard';

const MANAGER_ID = 'emp-002';

const EMPLOYEE_NAMES: Record<string, string> = {
  'emp-001': 'Alice Johnson',
  'emp-002': 'Bob Smith',
};

function ManagerRequestItem({ request }: { request: import('@/lib/types').TimeOffRequest }) {
  const { approveMutation, denyMutation } = useManagerActionMutation();

  // Re-fetch fresh balance just-in-time for decision context
  const {
    data: balance,
    isLoading: balanceIsLoading,
    dataUpdatedAt: balanceFetchedAt,
  } = useBalance(request.employeeId, request.locationId);

  return (
    <ManagerRequestCard
      request={request}
      employeeName={EMPLOYEE_NAMES[request.employeeId]}
      balance={balance}
      balanceIsLoading={balanceIsLoading}
      balanceFetchedAt={balanceFetchedAt || undefined}
      onApprove={async (id) => {
        await approveMutation.mutateAsync({ requestId: id, managerId: MANAGER_ID });
      }}
      onDeny={async (id) => {
        await denyMutation.mutateAsync({ requestId: id, managerId: MANAGER_ID });
      }}
    />
  );
}

export default function ManagerPage() {
  const { data: pendingRequests, isLoading, isFetching } = usePendingRequests();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 mb-1 block">
              ← Home
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-sm text-gray-500">Bob Smith · emp-002 · Manager</p>
          </div>
          {isFetching && (
            <span className="text-xs text-gray-400 animate-pulse">Refreshing...</span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 h-40" />
            ))}
          </div>
        ) : !pendingRequests?.length ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-500">No pending requests to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} pending
            </p>
            {pendingRequests.map((req) => (
              <ManagerRequestItem key={req.id} request={req} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
