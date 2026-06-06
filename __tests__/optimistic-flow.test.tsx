import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimisticStore } from '../store/optimistic-store';

describe('OptimisticStore — request lifecycle', () => {
  beforeEach(() => {
    // Reset store between tests
    useOptimisticStore.setState({ requests: [], timers: new Map() });
  });

  it('adds a request in submitting state', () => {
    const { result } = renderHook(() => useOptimisticStore());
    act(() => {
      result.current.addRequest({
        localId: 'local-test-1',
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        daysRequested: 3,
      });
    });
    expect(result.current.requests).toHaveLength(1);
    expect(result.current.requests[0].state).toBe('submitting');
    expect(result.current.requests[0].daysRequested).toBe(3);
  });

  it('transitions to pending-confirmation after confirmSubmit', () => {
    const { result } = renderHook(() => useOptimisticStore());
    act(() => {
      result.current.addRequest({
        localId: 'local-test-2',
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        daysRequested: 2,
      });
    });
    act(() => {
      result.current.confirmSubmit('local-test-2', 'req-server-100');
    });
    expect(result.current.requests[0].state).toBe('pending-confirmation');
    expect(result.current.requests[0].serverRequestId).toBe('req-server-100');
  });

  it('rolls back and sets error message', () => {
    const { result } = renderHook(() => useOptimisticStore());
    act(() => {
      result.current.addRequest({
        localId: 'local-test-3',
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        daysRequested: 5,
      });
    });
    act(() => {
      result.current.rollback('local-test-3', 'Insufficient balance');
    });
    expect(result.current.requests[0].state).toBe('rolled-back');
    expect(result.current.requests[0].errorMessage).toBe('Insufficient balance');
  });

  it('computes optimistic deductions only for active states', () => {
    const { result } = renderHook(() => useOptimisticStore());
    act(() => {
      result.current.addRequest({
        localId: 'local-a',
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        daysRequested: 3,
      });
      result.current.addRequest({
        localId: 'local-b',
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        daysRequested: 2,
      });
    });
    // Both in 'submitting' → total deduction = 5
    expect(result.current.getOptimisticDeductions('emp-001', 'loc-nyc')).toBe(5);

    // Roll back local-b → deduction = 3
    act(() => {
      result.current.rollback('local-b', 'Error');
    });
    expect(result.current.getOptimisticDeductions('emp-001', 'loc-nyc')).toBe(3);
  });

  it('does not count deductions for a different location', () => {
    const { result } = renderHook(() => useOptimisticStore());
    act(() => {
      result.current.addRequest({
        localId: 'local-c',
        employeeId: 'emp-001',
        locationId: 'loc-la',
        daysRequested: 4,
      });
    });
    expect(result.current.getOptimisticDeductions('emp-001', 'loc-nyc')).toBe(0);
    expect(result.current.getOptimisticDeductions('emp-001', 'loc-la')).toBe(4);
  });

  it('marks verification warning', () => {
    const { result } = renderHook(() => useOptimisticStore());
    act(() => {
      result.current.addRequest({
        localId: 'local-d',
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        daysRequested: 2,
      });
      result.current.markVerificationWarning('local-d');
    });
    expect(result.current.requests[0].state).toBe('verification-warning');
    // Still counts as a deduction
    expect(result.current.getOptimisticDeductions('emp-001', 'loc-nyc')).toBe(2);
  });

  it('removes confirmed requests from deductions', () => {
    const { result } = renderHook(() => useOptimisticStore());
    act(() => {
      result.current.addRequest({
        localId: 'local-e',
        employeeId: 'emp-001',
        locationId: 'loc-nyc',
        daysRequested: 3,
      });
      result.current.confirmSubmit('local-e', 'req-500');
      result.current.markConfirmed('local-e');
    });
    expect(result.current.requests).toHaveLength(0);
    expect(result.current.getOptimisticDeductions('emp-001', 'loc-nyc')).toBe(0);
  });
});
