export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager';
}

export interface Balance {
  employeeId: string;
  locationId: string;
  locationName: string;
  availableDays: number;
  usedDays: number;
  totalDays: number;
  lastUpdated: string; // ISO timestamp from HCM
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  createdAt: string;
  resolvedAt?: string;
  managerId?: string;
}

// Client-only optimistic state
export interface OptimisticRequest {
  localId: string;
  employeeId: string;
  locationId: string;
  daysRequested: number;
  state: 'submitting' | 'pending-confirmation' | 'rolled-back' | 'verification-warning';
  submittedAt: number; // Date.now()
  serverRequestId?: string; // set when HCM responds
  errorMessage?: string;
}
