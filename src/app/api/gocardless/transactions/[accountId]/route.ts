import { NextResponse } from 'next/server';
import { goCardlessRequest } from '@/lib/gocardless';
import { GOCARDLESS_CONFIG } from '@/config/gocardless';

async function getAccessToken() {
  try {
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
  } catch (error) {
    console.error('Error obtaining access token:', error);
    throw error;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  console.log(`GET /api/gocardless/transactions/${params.accountId}`);

  try {
    const accessToken = await getAccessToken();
    
    const requestUrl = `https://bankaccountdata.gocardless.com/api/v2/accounts/${params.accountId}/transactions/`;
    console.log(`Making GoCardless API request: GET ${requestUrl}`);
    console.log(`curl -X GET "${requestUrl}" -H "accept: application/json" -H "Authorization: Bearer ${accessToken}"`);

    const transactionsData = await goCardlessRequest({
      method: 'GET',
      path: `/api/v2/accounts/${params.accountId}/transactions/`,
      accessToken,
    });

    console.log('GoCardless transactions data:', transactionsData);

    return NextResponse.json(transactionsData);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    if (error instanceof Error) {
      if (error.message.includes('Daily request limit set by the Institution has been exceeded')) {
        return NextResponse.json({ 
          error: 'Daily request limit exceeded', 
          message: 'The daily limit for requesting transactions has been reached. Please try again tomorrow.'
        }, { status: 429 });
      }
      if (error.message === 'Not found.') {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}