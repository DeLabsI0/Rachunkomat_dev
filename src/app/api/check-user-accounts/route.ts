import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  console.log(`API: Checking accounts for user: ${userId}`);

  if (!userId) {
    console.log('API Error: User ID is required');
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const requisitionsRef = collection(db, 'requisitions');
    const q = query(requisitionsRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);

    let hasAccounts = false;

    querySnapshot.forEach((doc) => {
      const requisitionData = doc.data();
      if (requisitionData.accounts && requisitionData.accounts.length > 0) {
        hasAccounts = true;
      }
    });

    console.log(`API: User ${userId} hasAccounts: ${hasAccounts}`);
    return NextResponse.json({ hasAccounts });
  } catch (error) {
    console.error('API Error checking user accounts:', error);
    return NextResponse.json({ error: 'Failed to check user accounts' }, { status: 500 });
  }
}