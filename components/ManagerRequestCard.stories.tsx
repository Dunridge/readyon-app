import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { ManagerRequestCard } from './ManagerRequestCard';
import type { TimeOffRequest, Balance } from '@/lib/types';

const PENDING_REQUEST: TimeOffRequest = {
  id: 'req-001',
  employeeId: 'emp-001',
  locationId: 'loc-nyc',
  startDate: '2026-07-01',
  endDate: '2026-07-03',
  daysRequested: 3,
  reason: 'Family vacation',
  status: 'pending',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

const FRESH_BALANCE: Balance = {
  employeeId: 'emp-001',
  locationId: 'loc-nyc',
  locationName: 'New York (NYC)',
  availableDays: 10,
  usedDays: 5,
  totalDays: 15,
  lastUpdated: new Date().toISOString(),
};

const STALE_BALANCE: Balance = {
  ...FRESH_BALANCE,
  lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
};

const meta: Meta<typeof ManagerRequestCard> = {
  title: 'Components/ManagerRequestCard',
  component: ManagerRequestCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    request: PENDING_REQUEST,
    employeeName: 'Alice Johnson',
    onApprove: fn(),
    onDeny: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ManagerRequestCard>;

export const Default: Story = {
  args: {
    balance: FRESH_BALANCE,
    balanceFetchedAt: Date.now(),
  },
};

export const LoadingBalance: Story = {
  name: 'Loading (balance fetching)',
  args: {
    balanceIsLoading: true,
  },
};

export const StaleBalance: Story = {
  name: 'Stale Balance (> 2 min)',
  args: {
    balance: STALE_BALANCE,
    balanceFetchedAt: Date.now() - 3 * 60 * 1000,
  },
};

export const InsufficientBalance: Story = {
  name: 'Insufficient Balance',
  args: {
    request: { ...PENDING_REQUEST, daysRequested: 12 },
    balance: { ...FRESH_BALANCE, availableDays: 2 },
    balanceFetchedAt: Date.now(),
  },
};

export const NoBalanceData: Story = {
  name: 'Balance Data Unavailable',
  args: {
    balance: undefined,
  },
};
