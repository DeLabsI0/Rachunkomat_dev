import { NextResponse } from 'next/server';
import { db } from '@/config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { data } = await request.json();
    console.log('Attempting to save data:', data);
    const docRef = await addDoc(collection(db, 'test_collection'), data);
    console.log('Document written with ID: ', docRef.id);
    return NextResponse.json({ message: 'Data saved successfully', id: docRef.id });
  } catch (error) {
    console.error('Error saving data:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to save data', details: error.message, stack: error.stack }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to save data', details: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('Attempting to fetch data');
    console.log('Firestore instance:', db);
    const querySnapshot = await getDocs(collection(db, 'test_collection'));
    console.log('Query snapshot:', querySnapshot);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Fetched data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Failed to fetch data', details: error.message, stack: error.stack }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to fetch data', details: String(error) }, { status: 500 });
  }
}