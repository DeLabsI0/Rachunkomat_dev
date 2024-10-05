import { NextResponse } from 'next/server';
import { AnalyzeDocumentCommand, AnalyzeExpenseCommand, TextractClient } from "@aws-sdk/client-textract";
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
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    let buffer: Buffer;

    if (file) {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else if (path) {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json({ error: 'No file or path provided' }, { status: 400 });
    }

    const params = {
      Document: {
        Bytes: buffer
      },
      FeatureTypes: ["FORMS", "TABLES"] as const
    };

    const command = new AnalyzeExpenseCommand(params);
    const data = await textractClient.send(command);

    return NextResponse.json({ textractResponse: data });
  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}


