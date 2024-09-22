import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
  const { userId } = await request.json();
  console.log(`User logged in with ID: ${userId}`);
  console.log('Fetching requisitions for this user from Firebase...');

  try {
    const requisitionsRef = collection(db, 'requisitions');
    const q = query(requisitionsRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);

    console.log(`Found ${querySnapshot.size} requisitions for user ${userId}`);

    querySnapshot.forEach((doc) => {
      const requisitionData = doc.data();
      if (requisitionData.accounts && requisitionData.accounts.length > 0) {
        console.log(`Requisition ${doc.id} has non-empty accounts array:`);
        console.log('Accounts:', requisitionData.accounts);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    return NextResponse.json({ error: 'Failed to fetch requisitions' }, { status: 500 });
  }
}