import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: Request) {
  console.log('API: user-requisitions route called');
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  console.log(`API: Checking requisitions for user: ${userId}`);

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

    let hasAccounts = false;

    querySnapshot.forEach((doc) => {
      const requisitionData = doc.data();
      console.log(`API: Requisition ${doc.id} data:`, requisitionData);
      if (requisitionData.accounts && requisitionData.accounts.length > 0) {
        hasAccounts = true;
        console.log(`API: User ${userId} has accounts in requisition ${doc.id}`);
      }
    });

    console.log(`API: User ${userId} hasAccounts: ${hasAccounts}`);
    return NextResponse.json({ hasAccounts });
  } catch (error) {
    console.error('API Error checking user requisitions:', error);
    return NextResponse.json({ error: 'Failed to check user requisitions' }, { status: 500 });
  }
}