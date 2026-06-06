/**
 * In-memory HCM mock store — module-level singleton.
 * State persists across API calls in the dev server process.
 */
import type { Balance, Employee, TimeOffRequest } from './types';

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const EMPLOYEES: Employee[] = [
  { id: 'emp-001', name: 'Alice Johnson', email: 'alice@readyon.com', role: 'employee' },
  { id: 'emp-002', name: 'Bob Smith', email: 'bob@readyon.com', role: 'manager' },
];

const BALANCES: Balance[] = [
  {
    employeeId: 'emp-001',
    locationId: 'loc-nyc',
    locationName: 'New York (NYC)',
    availableDays: 10,
    usedDays: 5,
    totalDays: 15,
    lastUpdated: new Date().toISOString(),
  },
  {
    employeeId: 'emp-001',
    locationId: 'loc-la',
    locationName: 'Los Angeles (LA)',
    availableDays: 8,
    usedDays: 2,
    totalDays: 10,
    lastUpdated: new Date().toISOString(),
  },
  {
    employeeId: 'emp-002',
    locationId: 'loc-nyc',
    locationName: 'New York (NYC)',
    availableDays: 12,
    usedDays: 3,
    totalDays: 15,
    lastUpdated: new Date().toISOString(),
  },
];

const now = new Date();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

const REQUESTS: TimeOffRequest[] = [
  {
    id: 'req-001',
    employeeId: 'emp-001',
    locationId: 'loc-nyc',
    startDate: '2026-07-01',
    endDate: '2026-07-03',
    daysRequested: 3,
    reason: 'Family vacation',
    status: 'pending',
    createdAt: twoDaysAgo.toISOString(),
  },
  {
    id: 'req-002',
    employeeId: 'emp-001',
    locationId: 'loc-la',
    startDate: '2026-08-15',
    endDate: '2026-08-16',
    daysRequested: 2,
    reason: 'Medical appointment',
    status: 'pending',
    createdAt: threeDaysAgo.toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Global singleton (survives hot-reload in Next.js dev via globalThis)
// ---------------------------------------------------------------------------

declare global {
  // eslint-disable-next-line no-var
  var __hcmStore: HCMStore | undefined;
}

interface HCMStore {
  employees: Employee[];
  balances: Balance[];
  requests: TimeOffRequest[];
  requestCounter: number;
}

function createStore(): HCMStore {
  return {
    employees: [...EMPLOYEES],
    balances: JSON.parse(JSON.stringify(BALANCES)),
    requests: JSON.parse(JSON.stringify(REQUESTS)),
    requestCounter: 100,
  };
}

const store: HCMStore = globalThis.__hcmStore ?? createStore();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__hcmStore = store;
}

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getEmployee(id: string): Employee | undefined {
  return store.employees.find((e) => e.id === id);
}

export function getBalance(employeeId: string, locationId: string): Balance | undefined {
  return store.balances.find((b) => b.employeeId === employeeId && b.locationId === locationId);
}

export function getBalancesForEmployee(employeeId: string): Balance[] {
  return store.balances.filter((b) => b.employeeId === employeeId);
}

export function getRequestsForEmployee(employeeId: string): TimeOffRequest[] {
  return store.requests.filter((r) => r.employeeId === employeeId);
}

export function getPendingRequests(): TimeOffRequest[] {
  return store.requests.filter((r) => r.status === 'pending');
}

export function getRequest(id: string): TimeOffRequest | undefined {
  return store.requests.find((r) => r.id === id);
}

export interface CreateRequestInput {
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string;
}

export function createRequest(input: CreateRequestInput): TimeOffRequest | null {
  const balance = getBalance(input.employeeId, input.locationId);
  if (!balance) return null;

  // Insufficient balance → conflict
  if (balance.availableDays < input.daysRequested) return null;

  store.requestCounter += 1;
  const req: TimeOffRequest = {
    id: `req-${store.requestCounter}`,
    employeeId: input.employeeId,
    locationId: input.locationId,
    startDate: input.startDate,
    endDate: input.endDate,
    daysRequested: input.daysRequested,
    reason: input.reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  store.requests.push(req);
  return req;
}

export function approveRequest(id: string, managerId: string): TimeOffRequest | null {
  const req = getRequest(id);
  if (!req || req.status !== 'pending') return null;

  req.status = 'approved';
  req.resolvedAt = new Date().toISOString();
  req.managerId = managerId;

  // Deduct balance
  const balance = getBalance(req.employeeId, req.locationId);
  if (balance) {
    balance.availableDays -= req.daysRequested;
    balance.usedDays += req.daysRequested;
    balance.lastUpdated = new Date().toISOString();
  }
  return req;
}

export function denyRequest(id: string, managerId: string): TimeOffRequest | null {
  const req = getRequest(id);
  if (!req || req.status !== 'pending') return null;

  req.status = 'denied';
  req.resolvedAt = new Date().toISOString();
  req.managerId = managerId;
  return req;
}

export function triggerAnniversaryBonus(employeeId: string, locationId: string, bonusDays: number): Balance | null {
  const balance = getBalance(employeeId, locationId);
  if (!balance) return null;
  balance.availableDays += bonusDays;
  balance.totalDays += bonusDays;
  balance.lastUpdated = new Date().toISOString();
  return balance;
}
