import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase/firebase';
import { getDownloadURL, ref } from 'firebase/storage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  }

  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.split('/').pop()}"`,
      },
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
  }
}