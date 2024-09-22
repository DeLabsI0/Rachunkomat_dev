import { NextResponse } from 'next/server';
import { goCardlessRequest } from '@/lib/gocardless';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];

  if (!accessToken) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
  }

  try {
    const data = await goCardlessRequest({
      method: 'GET',
      path: `/api/v2/accounts/${params.id}/`,
      accessToken,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching account metadata:', error);
    return NextResponse.json({ error: 'Failed to fetch account metadata' }, { status: 500 });
  }
}