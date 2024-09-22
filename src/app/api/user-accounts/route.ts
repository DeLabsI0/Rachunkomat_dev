import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  console.log(`API: Fetching accounts for user: ${userId}`);

  if (!userId) {
    console.log('API Error: User ID is required');
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const requisitionsRef = collection(db, 'requisitions');
    const q = query(requisitionsRef, where('user_id', '==', userId));
    console.log(`API: Querying Firestore for user ${userId}`);
    const querySnapshot = await getDocs(q);

    console.log(`API: Found ${querySnapshot.size} requisitions for user ${userId}`);

    const accountIds: string[] = [];

    querySnapshot.forEach((doc) => {
      const requisitionData = doc.data();
      console.log(`API: Requisition ${doc.id} data:`, requisitionData);
      if (requisitionData.accounts && Array.isArray(requisitionData.accounts)) {
        accountIds.push(...requisitionData.accounts);
      }
    });

    console.log(`API: Found ${accountIds.length} account IDs for user ${userId}`);

    // Fetch detailed account information from GoCardless
    const accessToken = await getAccessToken();
    const detailedAccounts = await Promise.all(
      accountIds.map(async (accountId) => {
        try {
          const accountData = await goCardlessRequest({
            method: 'GET',
            path: `/api/v2/accounts/${accountId}/`,
            accessToken,
          });
          return accountData;
        } catch (error) {
          console.error(`Error fetching details for account ${accountId}:`, error);
          return null;
        }
      })
    );

    const validAccounts = detailedAccounts.filter(account => account !== null);

    console.log(`API: Fetched ${validAccounts.length} detailed accounts for user ${userId}`);
    return NextResponse.json({ accounts: validAccounts });
  } catch (error) {
    console.error('API Error fetching user accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch user accounts' }, { status: 500 });
  }
}

interface Account {
  id: string;
  iban: string;
  institution_id: string;
}