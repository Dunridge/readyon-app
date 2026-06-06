'use client';

import { useState } from 'react';
import type { Balance } from '@/lib/types';
import { useTimeOffMutation } from '@/hooks/useTimeOffMutation';
import { useOptimisticStore } from '@/store/optimistic-store';

interface RequestFormProps {
  employeeId: string;
  balances: Balance[];
  onSuccess?: () => void;
}

function calcBusinessDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  let days = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function RequestForm({ employeeId, balances, onSuccess }: RequestFormProps) {
  const [locationId, setLocationId] = useState(balances[0]?.locationId ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const mutation = useTimeOffMutation();
  const getOptimisticDeductions = useOptimisticStore((s) => s.getOptimisticDeductions);

  const selectedBalance = balances.find((b) => b.locationId === locationId);
  const optimisticDeductions = selectedBalance
    ? getOptimisticDeductions(employeeId, locationId)
    : 0;
  const displayAvailable = selectedBalance
    ? Math.max(0, selectedBalance.availableDays - optimisticDeductions)
    : 0;

  const daysRequested = calcBusinessDays(startDate, endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!locationId) return setFormError('Please select a location.');
    if (!startDate || !endDate) return setFormError('Please select start and end dates.');
    if (daysRequested <= 0) return setFormError('End date must be on or after start date.');
    if (daysRequested > displayAvailable) {
      return setFormError(
        `Insufficient balance. You have ${displayAvailable} day(s) available but requested ${daysRequested}.`
      );
    }

    try {
      await mutation.mutateAsync({
        employeeId,
        locationId,
        startDate,
        endDate,
        daysRequested,
        reason,
      });
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      setFormError('');
      onSuccess?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Request failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Location */}
      <div>
        <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <select
          id="locationId"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {balances.map((b) => (
            <option key={b.locationId} value={b.locationId}>
              {b.locationName} ({b.availableDays - getOptimisticDeductions(employeeId, b.locationId)} days available)
            </option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Days preview */}
      {daysRequested > 0 && (
        <div className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-2 text-sm text-indigo-700">
          <span className="font-semibold">{daysRequested}</span> business day(s) requested
          {selectedBalance && (
            <span className="text-indigo-500">
              {' '}· {displayAvailable} available
            </span>
          )}
        </div>
      )}

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
          Reason <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Vacation, medical appointment, personal..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Error */}
      {formError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {mutation.isPending ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
