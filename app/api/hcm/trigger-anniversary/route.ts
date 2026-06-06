import { triggerAnniversaryBonus } from '@/lib/hcm-store';

export async function POST(request: Request) {
  const body = await request.json();
  const { employeeId, locationId, bonusDays = 2 } = body;

  if (!employeeId || !locationId) {
    return Response.json({ error: 'employeeId and locationId are required' }, { status: 400 });
  }

  const balance = triggerAnniversaryBonus(employeeId, locationId, bonusDays);
  if (!balance) {
    return Response.json({ error: 'Employee or location not found' }, { status: 404 });
  }

  return Response.json({ success: true, balance });
}
