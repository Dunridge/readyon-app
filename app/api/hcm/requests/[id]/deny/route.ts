import { denyRequest } from '@/lib/hcm-store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const managerId = body.managerId ?? 'emp-002';

  const req = denyRequest(id, managerId);
  if (!req) {
    return Response.json({ error: 'Request not found or not pending' }, { status: 404 });
  }

  return Response.json({ success: true, request: req });
}
