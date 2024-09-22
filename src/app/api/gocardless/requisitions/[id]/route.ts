import { NextResponse } from 'next/server';
import { goCardlessRequest } from '@/lib/gocardless';
import { GOCARDLESS_CONFIG } from '@/config/gocardless';

async function getAccessToken() {
  const tokenResponse = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      secret_id: GOCARDLESS_CONFIG.SECRET_ID,
      secret_key: GOCARDLESS_CONFIG.SECRET_KEY,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new Error(tokenData.detail || 'Failed to obtain access token');
  }

  return tokenData.access;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('API route hit. Request:', request.url);
  console.log('Params:', params);
  
  try {
    const accessToken = await getAccessToken();

    // First, try to fetch by ID
    try {
      const requisitionData = await goCardlessRequest({
        method: 'GET',
        path: `/api/v2/requisitions/${params.id}/`,
        accessToken,
      });
      console.log('Requisition found by ID:', requisitionData);
      return NextResponse.json(requisitionData);
    } catch (error) {
      // If not found by ID, try to fetch by reference
      if (error instanceof Error && error.message === 'Not found.') {
        console.log('Requisition not found by ID, trying reference');
        const requisitionsByReference = await goCardlessRequest({
          method: 'GET',
          path: `/api/v2/requisitions/?reference=${params.id}`,
          accessToken,
        });
        if (requisitionsByReference.results && requisitionsByReference.results.length > 0) {
          console.log('Requisition found by reference:', requisitionsByReference.results[0]);
          return NextResponse.json(requisitionsByReference.results[0]);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in API route:', error);
    if (error instanceof Error) {
      if (error.message === 'Not found.') {
        return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}