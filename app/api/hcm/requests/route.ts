import { type NextRequest } from 'next/server';
import { getRequestsForEmployee, getPendingRequests } from '@/lib/hcm-store';

// GET /api/hcm/requests — list requests
// ?employeeId=X to get all requests for an employee
// ?pending=true to get all pending requests (manager view)
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const employeeId = searchParams.get('employeeId');
  const pending = searchParams.get('pending');

  if (pending === 'true') {
    return Response.json(getPendingRequests());
  }

  if (employeeId) {
    return Response.json(getRequestsForEmployee(employeeId));
  }

  return Response.json({ error: 'employeeId or pending=true is required' }, { status: 400 });
}
