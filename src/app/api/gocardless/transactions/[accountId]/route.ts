import { NextResponse } from 'next/server';
import { goCardlessRequest } from '@/lib/gocardless';
import { getAccessToken } from '@/services/gocardlessAuth';

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const accessToken = await getAccessToken();
    console.log(`[${new Date().toISOString()}] Calling goCardlessRequest for transactions of account ${params.accountId}`);
    const transactionsData = await goCardlessRequest({
      method: 'GET',
      path: `/api/v2/accounts/${params.accountId}/transactions/`,
      accessToken,
    });
    console.log(`[${new Date().toISOString()}] goCardlessRequest for transactions completed`);

    return NextResponse.json(transactionsData);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}