import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within, waitFor } from '@storybook/test';
import { ManagerRequestCard } from './ManagerRequestCard';
import type { TimeOffRequest, Balance } from '@/lib/types';

const PENDING_REQUEST: TimeOffRequest = {
  id: 'req-001', employeeId: 'emp-001', locationId: 'loc-nyc',
  startDate: '2026-07-01', endDate: '2026-07-03', daysRequested: 3,
  reason: 'Family vacation', status: 'pending',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

const FRESH_BALANCE: Balance = {
  employeeId: 'emp-001', locationId: 'loc-nyc', locationName: 'New York (NYC)',
  availableDays: 10, usedDays: 5, totalDays: 15,
  lastUpdated: new Date().toISOString(),
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
  args: { balance: FRESH_BALANCE, balanceFetchedAt: Date.now() },
};

export const LoadingBalance: Story = {
  name: 'Loading (balance fetching)',
  args: { balanceIsLoading: true },
};

export const StaleBalance: Story = {
  name: 'Stale Balance (> 2 min)',
  args: {
    balance: { ...FRESH_BALANCE, lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    balanceFetchedAt: Date.now() - 3 * 60 * 1000,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/stale/i)).toBeInTheDocument();
  },
};

export const InsufficientBalance: Story = {
  name: 'Insufficient Balance',
  args: {
    request: { ...PENDING_REQUEST, daysRequested: 12 },
    balance: { ...FRESH_BALANCE, availableDays: 2 },
    balanceFetchedAt: Date.now(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/insufficient balance/i)).toBeInTheDocument();
    // Approve button still present — manager can override
    await expect(canvas.getByRole('button', { name: /approve/i })).toBeInTheDocument();
  },
};

export const NoBalanceData: Story = {
  name: 'Balance Data Unavailable',
  args: { balance: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/unavailable/i)).toBeInTheDocument();
  },
};

// Manager clicks Approve — callback fires with correct request ID, card collapses
export const ApproveFlow: Story = {
  name: 'Interaction — Approve flow',
  args: {
    balance: FRESH_BALANCE,
    balanceFetchedAt: Date.now(),
    onApprove: fn(async () => {}),
    onDeny: fn(async () => {}),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    const approveBtn = canvas.getByRole('button', { name: /approve/i });
    await user.click(approveBtn);

    await waitFor(() => expect(args.onApprove).toHaveBeenCalledWith('req-001'));
    // Card collapses to "Action recorded." after resolution
    await waitFor(() =>
      expect(canvas.getByText(/action recorded/i)).toBeInTheDocument()
    );
  },
};

// Manager clicks Deny — callback fires, buttons become disabled during async operation
export const DenyFlow: Story = {
  name: 'Interaction — Deny flow',
  args: {
    balance: FRESH_BALANCE,
    balanceFetchedAt: Date.now(),
    onApprove: fn(async () => {}),
    onDeny: fn(async () => {}),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(canvas.getByRole('button', { name: /deny/i }));

    await waitFor(() => expect(args.onDeny).toHaveBeenCalledWith('req-001'));
    await waitFor(() =>
      expect(canvas.getByText(/action recorded/i)).toBeInTheDocument()
    );
  },
};

// HCM returns an error on approve — card shows inline error, does NOT collapse
export const ApproveError: Story = {
  name: 'Interaction — Approve error (HCM rejected)',
  args: {
    balance: FRESH_BALANCE,
    balanceFetchedAt: Date.now(),
    onApprove: fn(async () => { throw new Error('HCM rejected: quota exceeded'); }),
    onDeny: fn(async () => {}),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(canvas.getByRole('button', { name: /approve/i }));

    await waitFor(() =>
      expect(canvas.getByText(/HCM rejected/i)).toBeInTheDocument()
    );
    // Card must NOT collapse — manager needs to see the error and retry or deny
    await expect(canvas.queryByText(/action recorded/i)).not.toBeInTheDocument();
    // Both action buttons remain available for retry/fallback
    await expect(canvas.getByRole('button', { name: /approve/i })).toBeInTheDocument();
  },
};
