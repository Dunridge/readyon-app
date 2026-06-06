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

const inputClass =
  'w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] text-white px-3 py-2.5 text-sm placeholder-[#444] focus:outline-none focus:border-[#444] focus:bg-[#111] transition-colors';

const labelClass = 'block text-xs font-medium text-[#888] mb-1.5 uppercase tracking-wide';

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
        `Insufficient balance: ${displayAvailable} day(s) available, ${daysRequested} requested.`
      );
    }

    try {
      await mutation.mutateAsync({ employeeId, locationId, startDate, endDate, daysRequested, reason });
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
      <div>
        <label htmlFor="locationId" className={labelClass}>Location</label>
        <select
          id="locationId"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className={inputClass}
        >
          {balances.map((b) => (
            <option key={b.locationId} value={b.locationId}>
              {b.locationName} — {b.availableDays - getOptimisticDeductions(employeeId, b.locationId)} days available
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startDate" className={labelClass}>Start</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="endDate" className={labelClass}>End</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            min={startDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {daysRequested > 0 && (
        <div className="rounded-lg bg-[#0d1520] border border-[#1a3050] px-4 py-2.5 text-sm text-[#7eb8f7]">
          <span className="font-semibold">{daysRequested}</span> business day{daysRequested !== 1 ? 's' : ''}
          {selectedBalance && (
            <span className="text-[#4a7fa8]"> · {displayAvailable} available</span>
          )}
        </div>
      )}

      <div>
        <label htmlFor="reason" className={labelClass}>
          Reason <span className="text-[#444] normal-case font-normal">(optional)</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Vacation, personal..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {formError && (
        <div className="rounded-lg bg-[#1a0505] border border-[#3a1010] px-4 py-2.5 text-sm text-[#f87171]">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-lg bg-white text-black py-2.5 text-sm font-semibold hover:bg-[#e8e8e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {mutation.isPending ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
