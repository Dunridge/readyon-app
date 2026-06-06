import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
import { BalanceCard } from './BalanceCard';

const BASE_BALANCE = {
  employeeId: 'emp-001',
  locationId: 'loc-nyc',
  locationName: 'New York (NYC)',
  availableDays: 10,
  usedDays: 5,
  totalDays: 15,
  lastUpdated: new Date().toISOString(),
};

const meta: Meta<typeof BalanceCard> = {
  title: 'Components/BalanceCard',
  component: BalanceCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof BalanceCard>;

export const Default: Story = {
  args: { balance: BASE_BALANCE, optimisticDeductions: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Shows correct available day count
    await expect(canvas.getByText('10')).toBeInTheDocument();
    await expect(canvas.getByText('New York (NYC)')).toBeInTheDocument();
    // No staleness indicator when fresh
    await expect(canvas.queryByText(/m old/)).not.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: { balance: BASE_BALANCE, isLoading: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Skeleton renders, no actual number shown
    await expect(canvas.queryByText('10')).not.toBeInTheDocument();
  },
};

export const WithOptimisticDeduction: Story = {
  name: 'Optimistic Pending (deduction applied)',
  args: { balance: BASE_BALANCE, optimisticDeductions: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Displays optimistically deducted number (10 - 3 = 7)
    await expect(canvas.getByText('7')).toBeInTheDocument();
    // Shows the actual vs pending breakdown
    await expect(canvas.getByText(/10 actual/)).toBeInTheDocument();
    await expect(canvas.getByText(/3 pending/)).toBeInTheDocument();
  },
};

export const LowBalance: Story = {
  args: { balance: { ...BASE_BALANCE, availableDays: 1, usedDays: 14, totalDays: 15 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('1')).toBeInTheDocument();
  },
};

export const ZeroBalance: Story = {
  args: { balance: { ...BASE_BALANCE, availableDays: 0, usedDays: 15, totalDays: 15 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('0')).toBeInTheDocument();
  },
};

export const StaleData: Story = {
  name: 'Stale (data > 2 min old)',
  args: {
    balance: { ...BASE_BALANCE, lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    isStale: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Staleness indicator must be visible
    await expect(canvas.getByText(/m old/)).toBeInTheDocument();
  },
};

export const BalanceRefreshedMidSession: Story = {
  name: 'Balance Refreshed Mid-Session',
  args: {
    balance: {
      ...BASE_BALANCE,
      availableDays: 12,
      totalDays: 17,
      lastUpdated: new Date().toISOString(),
    },
    optimisticDeductions: 2,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // After anniversary bonus (12 available) minus 2 pending = 10 displayed
    await expect(canvas.getByText('10')).toBeInTheDocument();
    await expect(canvas.getByText(/12 actual/)).toBeInTheDocument();
    await expect(canvas.getByText(/2 pending/)).toBeInTheDocument();
  },
};
