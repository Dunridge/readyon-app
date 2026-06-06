import type { Meta, StoryObj } from '@storybook/react';
import { RequestList } from './RequestList';
import type { TimeOffRequest, OptimisticRequest } from '@/lib/types';

const SERVER_REQUESTS: TimeOffRequest[] = [
  {
    id: 'req-001',
    employeeId: 'emp-001',
    locationId: 'loc-nyc',
    startDate: '2026-07-01',
    endDate: '2026-07-03',
    daysRequested: 3,
    reason: 'Family vacation',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-002',
    employeeId: 'emp-001',
    locationId: 'loc-nyc',
    startDate: '2026-05-01',
    endDate: '2026-05-02',
    daysRequested: 2,
    reason: 'Medical appointment',
    status: 'approved',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-003',
    employeeId: 'emp-001',
    locationId: 'loc-la',
    startDate: '2026-04-10',
    endDate: '2026-04-10',
    daysRequested: 1,
    status: 'denied',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const OPTIMISTIC_SUBMITTING: OptimisticRequest = {
  localId: 'local-1',
  employeeId: 'emp-001',
  locationId: 'loc-nyc',
  daysRequested: 2,
  state: 'submitting',
  submittedAt: Date.now(),
};

const OPTIMISTIC_PENDING: OptimisticRequest = {
  localId: 'local-2',
  employeeId: 'emp-001',
  locationId: 'loc-nyc',
  daysRequested: 2,
  state: 'pending-confirmation',
  submittedAt: Date.now() - 5000,
  serverRequestId: 'req-999',
};

const OPTIMISTIC_ROLLED_BACK: OptimisticRequest = {
  localId: 'local-3',
  employeeId: 'emp-001',
  locationId: 'loc-nyc',
  daysRequested: 5,
  state: 'rolled-back',
  submittedAt: Date.now() - 8000,
  errorMessage: 'Insufficient balance',
};

const OPTIMISTIC_VERIFICATION_WARNING: OptimisticRequest = {
  localId: 'local-4',
  employeeId: 'emp-001',
  locationId: 'loc-nyc',
  daysRequested: 2,
  state: 'verification-warning',
  submittedAt: Date.now() - 35000,
};

const meta: Meta<typeof RequestList> = {
  title: 'Components/RequestList',
  component: RequestList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof RequestList>;

export const Empty: Story = {
  args: { requests: [], isEmpty: true },
};

export const Loading: Story = {
  args: { requests: [], isLoading: true },
};

export const WithServerRequests: Story = {
  args: { requests: SERVER_REQUESTS },
};

export const OptimisticSubmitting: Story = {
  name: 'Optimistic — Submitting',
  args: {
    requests: SERVER_REQUESTS,
    optimisticRequests: [OPTIMISTIC_SUBMITTING],
  },
};

export const OptimisticPendingConfirmation: Story = {
  name: 'Optimistic — Pending HCM Confirmation',
  args: {
    requests: SERVER_REQUESTS,
    optimisticRequests: [OPTIMISTIC_PENDING],
  },
};

export const OptimisticRolledBack: Story = {
  name: 'Optimistic — Rolled Back (HCM rejected)',
  args: {
    requests: SERVER_REQUESTS,
    optimisticRequests: [OPTIMISTIC_ROLLED_BACK],
  },
};

export const HCMSilentlyWrong: Story = {
  name: 'HCM Silently Wrong — Verification Warning',
  args: {
    requests: SERVER_REQUESTS,
    optimisticRequests: [OPTIMISTIC_VERIFICATION_WARNING],
  },
};
