import { NextResponse } from 'next/server';
import { TextractClient, AnalyzeDocumentCommand, AnalyzeExpenseCommand } from "@aws-sdk/client-textract";

const textractClient = new TextractClient({
  region: "us-west-2", // Replace with your AWS region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: buffer,
      },
      FeatureTypes: ["FORMS", "TABLES"],
    });

    const response = await textractClient.send(command);
    // Return the full Textract response
    
    return NextResponse.json({ textractResponse: response });
    
  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json({ error: 'Document needs to have 1 page' }, { status: 500 });
  }
}


