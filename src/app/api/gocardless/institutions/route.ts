import { NextResponse } from 'next/server';
import { goCardlessRequest } from '@/lib/gocardless';
import { getAccessToken } from '@/services/gocardlessAuth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  try {
    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained');

    if (country) {
      console.log(`[${new Date().toISOString()}] Calling goCardlessRequest for institutions in ${country}`);
      const institutionsData = await goCardlessRequest({
        method: 'GET',
        path: `/api/v2/institutions/?country=${country}`,
        accessToken,
      });
      console.log(`[${new Date().toISOString()}] goCardlessRequest for institutions completed`);
      console.log(`Fetched institutions for country: ${country}`);
      return NextResponse.json(institutionsData);
    } else {
      console.log(`[${new Date().toISOString()}] Calling goCardlessRequest for all institutions`);
      const allInstitutionsData = await goCardlessRequest({
        method: 'GET',
        path: '/api/v2/institutions/',
        accessToken,
      });
      console.log(`[${new Date().toISOString()}] goCardlessRequest for all institutions completed`);

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