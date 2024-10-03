import { GOCARDLESS_CONFIG } from '@/config/gocardless';
import { getAccessToken } from '@/services/gocardlessAuth';

// Remove the getAccessToken function from here

interface GoCardlessRequestOptions {
  method: string;
  path: string;
  body?: any;
  accessToken: string;
}

export async function goCardlessRequest({
  method,
  path,
  body,
  accessToken,
}: GoCardlessRequestOptions) {
  console.log(`Making GoCardless API request: ${method} ${path}`);
  console.log(`Using access token: ${accessToken.substring(0, 10)}...`);
  try {
    const response = await fetch(`https://bankaccountdata.gocardless.com${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    const data = await response.json();

    // Print full JSON response
    console.log('Full GoCardless API response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('GoCardless API error:', data);
      throw new Error(data.detail || data.summary || 'GoCardless API request failed');
    }

    console.log('GoCardless API request successful');
    return data;
  } catch (error) {
    console.error('Error in goCardlessRequest:', error);
    throw error;
  }
}