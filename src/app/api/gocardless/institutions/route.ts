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
    console.error('Error in getAccessToken:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  try {
    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained');

    if (country) {
      console.log(`Fetching institutions for country: ${country}`);
      const institutionsData = await goCardlessRequest({
        method: 'GET',
        path: `/api/v2/institutions/?country=${country}`,
        accessToken,
      });
      console.log(`Fetched institutions for country: ${country}`);
      return NextResponse.json(institutionsData);
    } else {
      console.log('Fetching all institutions');
      const allInstitutionsData = await goCardlessRequest({
        method: 'GET',
        path: '/api/v2/institutions/',
        accessToken,
      });

      const countries = [...new Set(allInstitutionsData.flatMap((inst: any) => inst.countries))];
      console.log('Fetched all institutions');
      return NextResponse.json(countries);
    }
  } catch (error) {
    console.error('Error in GET /api/gocardless/institutions:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}