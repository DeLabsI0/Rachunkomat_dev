import { NextResponse } from 'next/server';
import { goCardlessRequest } from '@/lib/gocardless';
import { getAccessToken } from '@/services/gocardlessAuth';

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

    const response = NextResponse.json(transactionsData);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
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