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
1. Amount Netto (Net Amount): This is the total amount before taxes. Look for labels like "Net Total", "Subtotal", or "Amount Before Tax".
2. VAT (Value Added Tax): This is the tax amount. Look for labels like "VAT", "Tax", or "GST".
3. Amount Brutto (Gross Amount): This is the total amount including taxes. Look for labels like "Total", "Grand Total", or "Amount Due".

Please follow these rules:
- Always provide numerical values without currency symbols.
- Use decimal points for fractional amounts (e.g., 100.50).
- If multiple VAT rates are present, sum them up into a single value.
- If the invoice is in a different currency, convert all amounts to the invoice's primary currency.
- If you're unsure about a value, use "N/A" instead of guessing.

Please provide the extracted information in a JSON format with the following structure:
{
  "amountNetto": "value",
  "vat": "value",
  "amountBrutto": "value"
}

If you cannot find a specific value, use "N/A" as the value.
`;

export async function POST(req: Request) {
  console.log('POST request received in invoice-processor');
  const { prompt } = await req.json();
  console.log('Received prompt length:', prompt.length);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Here's the invoice data to process. Please extract the required information and provide it in the specified JSON format.\n\nInvoice data:\n${prompt}` }
  ];

  console.log('Sending request to OpenAI');
  const response = await openai.createChatCompletion({
    model: 'gpt-4o-mini', // Using GPT-4
    stream: true,
    messages: messages,
  });
  console.log('Received response from OpenAI');

  const stream = OpenAIStream(response);
  console.log('Created OpenAIStream');
  return new StreamingTextResponse(stream);
}