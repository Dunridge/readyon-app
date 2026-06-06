'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { nanoid } from '@/lib/nanoid';
import { useOptimisticStore } from '@/store/optimistic-store';
import { balanceKeys } from './useBalances';
import { requestKeys } from './useRequests';

interface SubmitTimeOffInput {
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string;
}

export function useTimeOffMutation() {
  const queryClient = useQueryClient();
  const {
    addRequest,
    confirmSubmit,
    rollback,
    markVerificationWarning,
    startReconciliationTimer,
  } = useOptimisticStore();

  return useMutation({
    mutationFn: async (input: SubmitTimeOffInput) => {
      const res = await fetch('/api/hcm/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error ?? 'Request failed');
      }

      return res.json() as Promise<{
        success: boolean;
        request?: { id: string };
        silentFailure?: boolean;
      }>;
    },

    onMutate: async (input) => {
      const localId = nanoid();

      // Add optimistic entry
      addRequest({
        localId,
        employeeId: input.employeeId,
        locationId: input.locationId,
        daysRequested: input.daysRequested,
      });

      // Cancel any in-flight balance queries to avoid clobbering
      await queryClient.cancelQueries({
        queryKey: balanceKeys.byEmployee(input.employeeId),
      });

      return { localId };
    },

    onSuccess: (data, input, context) => {
      const { localId } = context as { localId: string };

      if (data.request?.id) {
        // HCM confirmed and returned a real ID
        confirmSubmit(localId, data.request.id);

        // Start 30s reconciliation timer
        startReconciliationTimer(localId, async () => {
          // After 30s, re-fetch the real balance and compare
          const freshBalance = await queryClient
            .fetchQuery({
              queryKey: balanceKeys.single(input.employeeId, input.locationId),
              queryFn: async () => {
                const res = await fetch(
                  `/api/hcm/balance?employeeId=${input.employeeId}&locationId=${input.locationId}`
                );
                if (!res.ok) throw new Error('Failed to fetch balance');
                return res.json();
              },
              staleTime: 0,
            })
            .catch(() => null);

          if (freshBalance) {
            // Invalidate so display refreshes
            queryClient.invalidateQueries({
              queryKey: balanceKeys.byEmployee(input.employeeId),
            });
          }
        });
      } else {
        // Silent failure: HCM returned 200 but no request ID
        // Start timer → after 30s if still no server ID → verification-warning
        startReconciliationTimer(localId, () => {
          markVerificationWarning(localId);
          // Re-fetch real balance to show accurate numbers
          queryClient.invalidateQueries({
            queryKey: balanceKeys.byEmployee(input.employeeId),
          });
        });
      }

      // Invalidate request list
      queryClient.invalidateQueries({
        queryKey: requestKeys.byEmployee(input.employeeId),
      });
    },

    onError: (_err, input, context) => {
      const { localId } = context as { localId: string };
      const errorMsg =
        _err instanceof Error ? _err.message : 'Unknown error occurred';

      rollback(localId, errorMsg);

      // Restore real balance data
      queryClient.invalidateQueries({
        queryKey: balanceKeys.byEmployee(input.employeeId),
      });
    },
  });
}

export function useManagerActionMutation() {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, managerId }: { requestId: string; managerId: string }) => {
      // Re-fetch balance just before approval for freshness check
      const res = await fetch(`/api/hcm/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error ?? 'Approval failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.pending() });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ requestId, managerId }: { requestId: string; managerId: string }) => {
      const res = await fetch(`/api/hcm/requests/${requestId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error ?? 'Denial failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.pending() });
    },
  });

  return { approveMutation, denyMutation };
}
