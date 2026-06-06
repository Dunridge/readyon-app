import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within, waitFor } from '@storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestForm } from './RequestForm';

const BALANCES = [
  {
    employeeId: 'emp-001', locationId: 'loc-nyc', locationName: 'New York (NYC)',
    availableDays: 10, usedDays: 5, totalDays: 15, lastUpdated: new Date().toISOString(),
  },
  {
    employeeId: 'emp-001', locationId: 'loc-la', locationName: 'Los Angeles (LA)',
    availableDays: 2, usedDays: 8, totalDays: 10, lastUpdated: new Date().toISOString(),
  },
];

function withQueryClient(Story: React.ComponentType) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <div className="max-w-md mx-auto p-6">
        <Story />
      </div>
    </QueryClientProvider>
  );
}

// Next Monday from today (always a weekday)
function nextMonday() {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  return d.toISOString().split('T')[0];
}

function nextTuesday() {
  const d = new Date(nextMonday());
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
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
  args: { balances: [{ ...BALANCES[0], availableDays: 2 }, BALANCES[1]] },
};

export const SingleLocation: Story = {
  args: { balances: [BALANCES[0]] },
};

// Fills dates and verifies the business-day count preview appears
export const DayCountPreview: Story = {
  name: 'Interaction — Day count preview',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.type(canvas.getByLabelText('Start'), nextMonday());
    await user.type(canvas.getByLabelText('End'), nextTuesday());

    await waitFor(() =>
      expect(canvas.getByText(/business day/)).toBeInTheDocument()
    );
  },
};

// Tries to submit without selecting dates — expects validation error
export const ValidationMissingDates: Story = {
  name: 'Interaction — Validation: missing dates',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await user.click(canvas.getByRole('button', { name: /submit request/i }));

    await waitFor(() =>
      expect(canvas.getByText(/please select start and end dates/i)).toBeInTheDocument()
    );
  },
};

// Requests more days than available — expects inline error
export const ValidationInsufficientBalance: Story = {
  name: 'Interaction — Validation: insufficient balance',
  args: { balances: [{ ...BALANCES[0], availableDays: 1 }, BALANCES[1]] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Select a range that spans more than 1 business day
    await user.type(canvas.getByLabelText('Start'), nextMonday());
    await user.type(canvas.getByLabelText('End'), nextTuesday());

    await user.click(canvas.getByRole('button', { name: /submit request/i }));

    await waitFor(() =>
      expect(canvas.getByText(/insufficient balance/i)).toBeInTheDocument()
    );
  },
};

// Happy path: mocks fetch so the mutation resolves, verifies onSuccess fires
export const SubmitSuccess: Story = {
  name: 'Interaction — Submit success (mocked API)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Stub fetch to return a successful HCM response
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ id: 'req-test', status: 'pending', employeeId: 'emp-001', locationId: 'loc-nyc', daysRequested: 2 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );

    try {
      await user.type(canvas.getByLabelText('Start'), nextMonday());
      await user.type(canvas.getByLabelText('End'), nextTuesday());
      await user.click(canvas.getByRole('button', { name: /submit request/i }));

      await waitFor(() => expect(args.onSuccess).toHaveBeenCalled(), { timeout: 3000 });
    } finally {
      globalThis.fetch = original;
    }
  },
};
