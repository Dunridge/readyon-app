import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestForm } from './RequestForm';

const BALANCES = [
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
    availableDays: 2,
    usedDays: 8,
    totalDays: 10,
    lastUpdated: new Date().toISOString(),
  },
];

function withQueryClient(Story: React.ComponentType) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-gray-200">
        <Story />
      </div>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof RequestForm> = {
  title: 'Components/RequestForm',
  component: RequestForm,
  tags: ['autodocs'],
  decorators: [withQueryClient],
  parameters: { layout: 'padded' },
  args: {
    employeeId: 'emp-001',
    balances: BALANCES,
    onSuccess: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof RequestForm>;

export const Default: Story = {};

export const LowBalance: Story = {
  name: 'Low Balance (2 days)',
  args: {
    balances: [
      { ...BALANCES[0], availableDays: 2 },
      BALANCES[1],
    ],
  },
};

export const SingleLocation: Story = {
  args: {
    balances: [BALANCES[0]],
  },
};
