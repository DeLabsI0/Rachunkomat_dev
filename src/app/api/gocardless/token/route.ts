import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { secret_id, secret_key } = await request.json();

    const response = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ secret_id, secret_key }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Failed to obtain access token');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error obtaining access token:', error);
    return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 500 });
  }
}