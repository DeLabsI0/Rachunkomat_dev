import { NextResponse } from 'next/server';
import { goCardlessRequest } from '@/lib/gocardless';
import { GOCARDLESS_CONFIG } from '@/config/gocardless';
import { db } from '@/config/firebase';
import { collection, addDoc } from 'firebase/firestore';

async function getAccessToken() {
  console.log('Attempting to get access token...');
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
      console.error('Failed to obtain access token:', tokenData);
      throw new Error(tokenData.detail || 'Failed to obtain access token');
    }

    console.log('Access token obtained successfully');
    return tokenData.access;
  } catch (error) {
    console.error('Error in getAccessToken:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  console.log('POST request received for /api/gocardless/requisitions');
  try {
    const { institution_id, redirect, reference, user_language, user_id } = await request.json();
    console.log('Received requisition request:', { institution_id, redirect, reference, user_language, user_id });

    // Always create a new requisition
    console.log('Creating new requisition...');
    const accessToken = await getAccessToken();
    console.log('Access token obtained:', accessToken);
    
    const newRequisitionData = await goCardlessRequest({
      method: 'POST',
      path: '/api/v2/requisitions/',
      accessToken,
      body: {
        institution_id,
        redirect,
        reference,
        user_language,
      },
    });

    console.log('New requisition created:', JSON.stringify(newRequisitionData, null, 2));

    // Save the new requisition to Firebase
    console.log('Saving new requisition to Firebase...');
    const requisitionsRef = collection(db, 'requisitions');
    const docRef = await addDoc(requisitionsRef, {
      ...newRequisitionData,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      user_id, // Add the user ID to the requisition document
    });
    console.log('New requisition saved to Firebase with ID:', docRef.id);

    console.log('Returning requisition data:', {
      link: newRequisitionData.link,
      id: newRequisitionData.id,
      reference: newRequisitionData.reference
    });

    return NextResponse.json({ 
      link: newRequisitionData.link,
      id: newRequisitionData.id,
      reference: newRequisitionData.reference
    });
  } catch (error) {
    console.error('Error creating requisition:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}