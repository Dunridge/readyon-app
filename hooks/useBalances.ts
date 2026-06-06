'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Balance } from '@/lib/types';

// Query key factories
export const balanceKeys = {
  all: ['balances'] as const,
  byEmployee: (employeeId: string) => ['balances', 'employee', employeeId] as const,
  single: (employeeId: string, locationId: string) =>
    ['balances', 'single', employeeId, locationId] as const,
};

// Batch read — all balances for an employee
export function useEmployeeBalances(employeeId: string) {
  return useQuery<Balance[]>({
    queryKey: balanceKeys.byEmployee(employeeId),
    queryFn: async () => {
      const res = await fetch(`/api/hcm/balances?employeeId=${employeeId}`);
      if (!res.ok) throw new Error('Failed to fetch balances');
      return res.json();
    },
    enabled: !!employeeId,
    // Refetch every 60 seconds (background polling)
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// Real-time single cell read
export function useBalance(employeeId: string, locationId: string) {
  return useQuery<Balance>({
    queryKey: balanceKeys.single(employeeId, locationId),
    queryFn: async () => {
      const res = await fetch(
        `/api/hcm/balance?employeeId=${employeeId}&locationId=${locationId}`
      );
      if (!res.ok) throw new Error('Failed to fetch balance');
      return res.json();
    },
    enabled: !!(employeeId && locationId),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// Force-refresh all balances for an employee
export function useRefreshBalances() {
  const queryClient = useQueryClient();
  return (employeeId: string) => {
    queryClient.invalidateQueries({ queryKey: balanceKeys.byEmployee(employeeId) });
  };
}
