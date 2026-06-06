import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BalanceCard } from '../components/BalanceCard';

const BASE_BALANCE = {
  employeeId: 'emp-001',
  locationId: 'loc-nyc',
  locationName: 'New York (NYC)',
  availableDays: 10,
  usedDays: 5,
  totalDays: 15,
  lastUpdated: new Date().toISOString(),
};

describe('BalanceCard', () => {
  it('renders location name and available days', () => {
    render(<BalanceCard balance={BASE_BALANCE} />);
    expect(screen.getByText('New York (NYC)')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    const { container } = render(<BalanceCard balance={BASE_BALANCE} isLoading />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('applies optimistic deductions to displayed balance', () => {
    render(<BalanceCard balance={BASE_BALANCE} optimisticDeductions={3} />);
    // Displayed = 10 - 3 = 7
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
  });

  it('does not go below zero with large optimistic deductions', () => {
    render(<BalanceCard balance={{ ...BASE_BALANCE, availableDays: 2 }} optimisticDeductions={5} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows staleness indicator when isStale=true and lastUpdated is old', () => {
    const oldBalance = {
      ...BASE_BALANCE,
      lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    };
    render(<BalanceCard balance={oldBalance} isStale />);
    expect(screen.getByText(/old/i)).toBeInTheDocument();
  });
});
