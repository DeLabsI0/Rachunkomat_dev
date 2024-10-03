import { NextResponse } from 'next/server';
import { getAccessToken } from '@/services/gocardlessAuth';

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    return NextResponse.json({ message: 'Authentication successful', token: accessToken });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}