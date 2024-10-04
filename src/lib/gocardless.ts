import { GOCARDLESS_CONFIG } from '@/config/gocardless';

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
  const url = new URL(path, GOCARDLESS_CONFIG.apiUrl);
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'GoCardless-Version': '2015-07-06',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Expires': '0',
  };

  console.log(`[${new Date().toISOString()}] Making GoCardless request: ${method} ${url}`);
  console.log(`[${new Date().toISOString()}] Request headers:`, JSON.stringify(headers, null, 2));
  if (body) {
    console.log(`[${new Date().toISOString()}] Request body:`, JSON.stringify(body, null, 2));
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(`[${new Date().toISOString()}] GoCardless response status:`, response.status);

  if (response.status === 404) {
    console.warn(`[${new Date().toISOString()}] Resource not found: ${path}`);
    return null;
  }

  let data;
  try {
    data = await response.json();
    console.log(`[${new Date().toISOString()}] GoCardless response data:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to parse JSON response:`, error);
    return null;
  }

  if (!response.ok) {
    console.error(`[${new Date().toISOString()}] GoCardless API error:`, data);
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. ${data.detail || ''}`);
    }
    throw new Error(data.detail || 'GoCardless API request failed');
  }

  return data;
}