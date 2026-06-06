import type { Meta, StoryObj } from '@storybook/react';
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
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof BalanceCard>;

export const Default: Story = {
  args: {
    balance: BASE_BALANCE,
    optimisticDeductions: 0,
  },
};

export const Loading: Story = {
  args: {
    balance: BASE_BALANCE,
    isLoading: true,
  },
};

export const WithOptimisticDeduction: Story = {
  name: 'Optimistic Pending (deduction applied)',
  args: {
    balance: BASE_BALANCE,
    optimisticDeductions: 3,
  },
};

export const LowBalance: Story = {
  args: {
    balance: { ...BASE_BALANCE, availableDays: 1, usedDays: 14, totalDays: 15 },
    optimisticDeductions: 0,
  },
};

export const ZeroBalance: Story = {
  args: {
    balance: { ...BASE_BALANCE, availableDays: 0, usedDays: 15, totalDays: 15 },
    optimisticDeductions: 0,
  },
};

export const StaleData: Story = {
  name: 'Stale (data > 2 min old)',
  args: {
    balance: {
      ...BASE_BALANCE,
      lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    isStale: true,
  },
};

export const BalanceRefreshedMidSession: Story = {
  name: 'Balance Refreshed Mid-Session',
  args: {
    balance: {
      ...BASE_BALANCE,
      availableDays: 12, // bumped by work anniversary bonus
      totalDays: 17,
      lastUpdated: new Date().toISOString(),
    },
    optimisticDeductions: 2,
  },
};
