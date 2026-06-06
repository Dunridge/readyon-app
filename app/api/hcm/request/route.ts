import { createRequest } from '@/lib/hcm-store';

// POST /api/hcm/request — file a time-off request
// 5% of requests silently fail (return 200 but don't persist)
export async function POST(request: Request) {
  const body = await request.json();

  const { employeeId, locationId, startDate, endDate, daysRequested, reason } = body;

  if (!employeeId || !locationId || !startDate || !endDate || !daysRequested) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 5% silent failure — return 200 success but don't actually write
  const isSilentFailure = Math.random() < 0.05;
  if (isSilentFailure) {
    return Response.json({ success: true, silentFailure: true, requestId: null });
  }

  const req = createRequest({ employeeId, locationId, startDate, endDate, daysRequested, reason });

  if (!req) {
    return Response.json(
      { error: 'Insufficient balance or invalid employee/location' },
      { status: 409 }
    );
  }

  return Response.json({ success: true, request: req });
}
