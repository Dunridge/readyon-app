import { type NextRequest } from 'next/server';
import { getBalance } from '@/lib/hcm-store';

// Real-time single-cell read
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get('employeeId');
  const locationId = searchParams.get('locationId');

  if (!employeeId || !locationId) {
    return Response.json({ error: 'employeeId and locationId are required' }, { status: 400 });
  }

  const balance = getBalance(employeeId, locationId);
  if (!balance) {
    return Response.json({ error: 'Balance not found' }, { status: 404 });
  }

  return Response.json(balance);
}
