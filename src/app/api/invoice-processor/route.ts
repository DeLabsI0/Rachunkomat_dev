import { NextResponse } from 'next/server';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(config);

export const runtime = 'edge';

const SYSTEM_PROMPT = `
You are an AI assistant specialized in extracting information from invoices. 
Your task is to analyze the given invoice data and extract the following information:
1. Amount Netto (Net Amount)
2. VAT (Value Added Tax)
3. Amount Brutto (Gross Amount)

Please provide the extracted information in a JSON format with the following structure:
{
  "amountNetto": "value",
  "vat": "value",
  "amountBrutto": "value"
}

If you cannot find a specific value, use "N/A" as the value.
`;

export async function POST(req: Request) {
  const { invoiceData } = await req.json();

  const prompt = `
${SYSTEM_PROMPT}

Here's the invoice data to process:
${JSON.stringify(invoiceData, null, 2)}

Please extract the required information and provide it in the specified JSON format.
`;

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}