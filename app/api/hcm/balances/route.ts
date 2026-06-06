import { type NextRequest } from 'next/server';
import { getBalancesForEmployee } from '@/lib/hcm-store';

// Batch read for an employee
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get('employeeId');

  if (!employeeId) {
    return Response.json({ error: 'employeeId is required' }, { status: 400 });
  }

  const balances = getBalancesForEmployee(employeeId);
  return Response.json(balances);
}
