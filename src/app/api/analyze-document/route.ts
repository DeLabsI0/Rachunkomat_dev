import { NextResponse } from 'next/server';
import { AnalyzeDocumentCommand, TextractClient } from "@aws-sdk/client-textract";
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase/firebase';

const textractClient = new TextractClient({
  region: "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const path = formData.get('path');

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const params = {
      Document: {
        Bytes: buffer
      },
      FeatureTypes: ["FORMS", "TABLES"]
    };

    const command = new AnalyzeDocumentCommand(params);
    const data = await textractClient.send(command);

    return NextResponse.json({ textractResponse: data });
  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}


