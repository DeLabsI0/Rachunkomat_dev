import { NextResponse } from 'next/server';
import { goCardlessRequest } from '@/lib/gocardless';
import { db } from '@/config/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAccessToken } from '@/services/gocardlessAuth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('requisition_id');

  console.log(`GET /api/gocardless/accounts?requisition_id=${reference}`);

  if (!reference) {
    return NextResponse.json({ error: 'Requisition ID is required' }, { status: 400 });
  }

  try {
    // 1. Check Firebase for the requisition data
    const requisitionsRef = collection(db, 'requisitions');
    const q = query(requisitionsRef, where('reference', '==', reference));
    const querySnapshot = await getDocs(q);

    let requisitionData;
    let documentId;
    if (!querySnapshot.empty) {
      documentId = querySnapshot.docs[0].id;
      requisitionData = querySnapshot.docs[0].data();
      console.log('Response: Requisition found in Firebase', requisitionData);
    } else {
      console.log('Response: Requisition not found in Firebase');
      return NextResponse.json({ error: 'Requisition not found in Firebase' }, { status: 404 });
    }

    // 2. Get account data from GoCardless
    const accessToken = await getAccessToken();
    console.log('Fetching requisition data from GoCardless');
    
    const requisitionId = requisitionData.id;
    const requestUrl = `https://bankaccountdata.gocardless.com/api/v2/requisitions/${requisitionId}/`;
    console.log(`Making GoCardless API request: GET ${requestUrl}`);
    console.log(`curl -X GET "${requestUrl}" -H "accept: application/json" -H "Authorization: Bearer ${accessToken}"`);

    const goCardlessRequisitionData = await goCardlessRequest({
      method: 'GET',
      path: `/api/v2/requisitions/${requisitionId}/`,
      accessToken,
    });

    console.log('GoCardless requisition data:', goCardlessRequisitionData);

    // Update Firebase with the latest data
    const docRef = doc(db, 'requisitions', documentId);
    await setDoc(docRef, { ...requisitionData, ...goCardlessRequisitionData }, { merge: true });
    console.log('Updated requisition data in Firebase');

    if (!goCardlessRequisitionData.accounts || goCardlessRequisitionData.accounts.length === 0) {
      console.log('Response: No accounts found for this requisition');
      return NextResponse.json({ message: 'No accounts found for this requisition', data: goCardlessRequisitionData });
    }

    console.log('Fetching account details');
    const accountPromises = goCardlessRequisitionData.accounts.map((accountId: string) =>
      goCardlessRequest({
        method: 'GET',
        path: `/api/v2/accounts/${accountId}/`,
        accessToken,
      })
    );

    const accounts = await Promise.all(accountPromises);
    console.log('Response: Accounts fetched successfully', accounts);
    const response = NextResponse.json({ 
      message: 'Accounts fetched successfully', 
      data: { ...goCardlessRequisitionData, accounts } 
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    if (error instanceof Error) {
      if (error.message === 'Not found.') {
        console.log('Response: Requisition not found');
        return NextResponse.json({ message: 'Requisition not found' }, { status: 404 });
      }
      console.log('Response: Error', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('Response: Unknown error occurred');
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}