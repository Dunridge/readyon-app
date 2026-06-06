import { create } from 'zustand';
import type { OptimisticRequest } from '@/lib/types';

const RECONCILIATION_TIMEOUT_MS = 30_000; // 30 seconds

interface OptimisticStore {
  requests: OptimisticRequest[];
  timers: Map<string, ReturnType<typeof setTimeout>>;

  // Add a new optimistic request (in 'submitting' state)
  addRequest: (req: Omit<OptimisticRequest, 'state' | 'submittedAt'>) => void;

  // Called when HCM returns a real request ID — move to pending-confirmation
  confirmSubmit: (localId: string, serverRequestId: string) => void;

  // Called when HCM returns an error — roll back
  rollback: (localId: string, errorMessage: string) => void;

  // Called after reconciliation timer fires and no server ID was set
  markVerificationWarning: (localId: string) => void;

  // Called when real balance confirms the request was applied
  markConfirmed: (localId: string) => void;

  // Remove a request from optimistic state (cleanup)
  remove: (localId: string) => void;

  // Compute total optimistic deductions for a given employee+location
  getOptimisticDeductions: (employeeId: string, locationId: string) => number;

  // Start reconciliation timer for a localId
  startReconciliationTimer: (localId: string, onTimeout: () => void) => void;

  // Clear all timers (for cleanup)
  clearTimers: () => void;
}

export const useOptimisticStore = create<OptimisticStore>((set, get) => ({
  requests: [],
  timers: new Map(),

  addRequest: (req) => {
    const newReq: OptimisticRequest = {
      ...req,
      state: 'submitting',
      submittedAt: Date.now(),
    };
    set((state) => ({ requests: [...state.requests, newReq] }));
  },

  confirmSubmit: (localId, serverRequestId) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.localId === localId
          ? { ...r, state: 'pending-confirmation' as const, serverRequestId }
          : r
      ),
    }));
  },

  rollback: (localId, errorMessage) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.localId === localId ? { ...r, state: 'rolled-back' as const, errorMessage } : r
      ),
    }));
    // Auto-remove rolled-back entry after 5s
    setTimeout(() => {
      get().remove(localId);
    }, 5000);
  },

  markVerificationWarning: (localId) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.localId === localId ? { ...r, state: 'verification-warning' as const } : r
      ),
    }));
  },

  markConfirmed: (localId) => {
    // Real balance now reflects this → remove from optimistic deductions
    get().remove(localId);
  },

  remove: (localId) => {
    const timer = get().timers.get(localId);
    if (timer) clearTimeout(timer);
    set((state) => {
      const newTimers = new Map(state.timers);
      newTimers.delete(localId);
      return {
        requests: state.requests.filter((r) => r.localId !== localId),
        timers: newTimers,
      };
    });
  },

  getOptimisticDeductions: (employeeId, locationId) => {
    return get()
      .requests.filter(
        (r) =>
          r.employeeId === employeeId &&
          r.locationId === locationId &&
          (r.state === 'submitting' ||
            r.state === 'pending-confirmation' ||
            r.state === 'verification-warning')
      )
      .reduce((sum, r) => sum + r.daysRequested, 0);
  },

  startReconciliationTimer: (localId, onTimeout) => {
    const existing = get().timers.get(localId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      onTimeout();
    }, RECONCILIATION_TIMEOUT_MS);

    set((state) => {
      const newTimers = new Map(state.timers);
      newTimers.set(localId, timer);
      return { timers: newTimers };
    });
  },

  clearTimers: () => {
    get().timers.forEach((timer) => clearTimeout(timer));
    set({ timers: new Map() });
  },
}));
