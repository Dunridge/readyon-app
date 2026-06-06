'use client';

import { useQuery } from '@tanstack/react-query';
import type { TimeOffRequest } from '@/lib/types';

export const requestKeys = {
  byEmployee: (employeeId: string) => ['requests', 'employee', employeeId] as const,
  pending: () => ['requests', 'pending'] as const,
};

export function useEmployeeRequests(employeeId: string) {
  return useQuery<TimeOffRequest[]>({
    queryKey: requestKeys.byEmployee(employeeId),
    queryFn: async () => {
      const res = await fetch(`/api/hcm/requests?employeeId=${employeeId}`);
      if (!res.ok) throw new Error('Failed to fetch requests');
      return res.json();
    },
    enabled: !!employeeId,
  });
}

export function usePendingRequests() {
  return useQuery<TimeOffRequest[]>({
    queryKey: requestKeys.pending(),
    queryFn: async () => {
      const res = await fetch('/api/hcm/requests?pending=true');
      if (!res.ok) throw new Error('Failed to fetch pending requests');
      return res.json();
    },
    refetchInterval: 30_000,
  });
}
