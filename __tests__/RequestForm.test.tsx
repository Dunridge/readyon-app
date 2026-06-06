import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestForm } from '../components/RequestForm';

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
];

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('RequestForm', () => {
  it('renders location select and date inputs', () => {
    render(
      <Wrapper>
        <RequestForm employeeId="emp-001" balances={BALANCES} />
      </Wrapper>
    );
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('shows error when submitting with no dates', async () => {
    render(
      <Wrapper>
        <RequestForm employeeId="emp-001" balances={BALANCES} />
      </Wrapper>
    );
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText(/please select start and end dates/i)).toBeInTheDocument();
    });
  });

  it('shows day count preview when dates are selected', async () => {
    render(
      <Wrapper>
        <RequestForm employeeId="emp-001" balances={BALANCES} />
      </Wrapper>
    );
    const startInput = screen.getByLabelText(/start date/i);
    const endInput = screen.getByLabelText(/end date/i);
    fireEvent.change(startInput, { target: { value: '2026-07-07' } }); // Tuesday
    fireEvent.change(endInput, { target: { value: '2026-07-09' } }); // Thursday
    await waitFor(() => {
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });
  });

  it('shows insufficient balance error', async () => {
    render(
      <Wrapper>
        <RequestForm
          employeeId="emp-001"
          balances={[{ ...BALANCES[0], availableDays: 1 }]}
        />
      </Wrapper>
    );
    const startInput = screen.getByLabelText(/start date/i);
    const endInput = screen.getByLabelText(/end date/i);
    fireEvent.change(startInput, { target: { value: '2026-07-07' } });
    fireEvent.change(endInput, { target: { value: '2026-07-09' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
    });
  });
});
