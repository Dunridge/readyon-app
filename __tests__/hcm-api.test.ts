/**
 * Integration tests for HCM API route handlers.
 * These test the store logic directly (not via HTTP) since we can't easily
 * spin up a Next.js server in Vitest.
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Reset the global store before each test
beforeEach(() => {
  if (typeof globalThis !== 'undefined') {
    delete (globalThis as Record<string, unknown>).__hcmStore;
  }
  // Re-import to reset module-level singleton
  vi.resetModules();
});

import { vi } from 'vitest';

describe('HCM Store', () => {
  it('returns balance for emp-001 / loc-nyc', async () => {
    const { getBalance } = await import('../lib/hcm-store');
    const balance = getBalance('emp-001', 'loc-nyc');
    expect(balance).toBeDefined();
    expect(balance?.availableDays).toBe(10);
    expect(balance?.locationName).toBe('New York (NYC)');
  });

  it('returns all balances for emp-001', async () => {
    const { getBalancesForEmployee } = await import('../lib/hcm-store');
    const balances = getBalancesForEmployee('emp-001');
    expect(balances).toHaveLength(2);
    const locationIds = balances.map((b) => b.locationId);
    expect(locationIds).toContain('loc-nyc');
    expect(locationIds).toContain('loc-la');
  });

  it('returns pending requests (seeded)', async () => {
    const { getPendingRequests } = await import('../lib/hcm-store');
    const pending = getPendingRequests();
    expect(pending.length).toBeGreaterThanOrEqual(2);
    pending.forEach((r) => expect(r.status).toBe('pending'));
  });

  it('creates a request and deducts nothing (pending still available)', async () => {
    const { createRequest, getBalance } = await import('../lib/hcm-store');
    const req = createRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      startDate: '2026-09-01',
      endDate: '2026-09-02',
      daysRequested: 2,
      reason: 'Test',
    });
    expect(req).not.toBeNull();
    expect(req?.status).toBe('pending');
    expect(req?.daysRequested).toBe(2);
    // Balance not deducted until approved
    const balance = getBalance('emp-001', 'loc-nyc');
    expect(balance?.availableDays).toBe(10);
  });

  it('rejects request creation when balance is insufficient', async () => {
    const { createRequest } = await import('../lib/hcm-store');
    const req = createRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      daysRequested: 20, // more than 10 available
    });
    expect(req).toBeNull();
  });

  it('approves a request and deducts balance', async () => {
    const { createRequest, approveRequest, getBalance } = await import('../lib/hcm-store');
    const req = createRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      daysRequested: 3,
    });
    expect(req).not.toBeNull();
    const approved = approveRequest(req!.id, 'emp-002');
    expect(approved?.status).toBe('approved');
    expect(approved?.managerId).toBe('emp-002');
    const balance = getBalance('emp-001', 'loc-nyc');
    expect(balance?.availableDays).toBe(7); // 10 - 3
    expect(balance?.usedDays).toBe(8); // 5 + 3
  });

  it('denies a request without changing balance', async () => {
    const { createRequest, denyRequest, getBalance } = await import('../lib/hcm-store');
    const req = createRequest({
      employeeId: 'emp-001',
      locationId: 'loc-nyc',
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      daysRequested: 1,
    });
    const denied = denyRequest(req!.id, 'emp-002');
    expect(denied?.status).toBe('denied');
    const balance = getBalance('emp-001', 'loc-nyc');
    expect(balance?.availableDays).toBe(10); // unchanged
  });

  it('adds anniversary bonus', async () => {
    const { triggerAnniversaryBonus, getBalance } = await import('../lib/hcm-store');
    triggerAnniversaryBonus('emp-001', 'loc-nyc', 2);
    const balance = getBalance('emp-001', 'loc-nyc');
    expect(balance?.availableDays).toBe(12);
    expect(balance?.totalDays).toBe(17);
  });
});
