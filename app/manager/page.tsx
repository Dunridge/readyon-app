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
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-[#1f1f1f] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[#555] hover:text-[#888] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">Pending Approvals</h1>
              <p className="text-xs text-[#555] mt-0.5">Bob Smith · Manager</p>
            </div>
          </div>
          {isFetching && (
            <span className="text-xs text-[#444] animate-pulse">Syncing...</span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[#1f1f1f] bg-[#111] h-40" />
            ))}
          </div>
        ) : !pendingRequests?.length ? (
          <div className="rounded-xl border border-dashed border-[#2a2a2a] p-16 text-center">
            <p className="text-[#555] text-sm">No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#444] mb-4">
              {pendingRequests.length} request{pendingRequests.length !== 1 ? 's' : ''} awaiting review
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
