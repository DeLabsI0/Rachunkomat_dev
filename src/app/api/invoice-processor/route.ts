import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the schema for the invoice data
const InvoiceData = z.object({
  amountNetto: z.string(),
  vat: z.string(),
  amountBrutto: z.string(),
});

// Division of the prompt into logical parts
const PROMPT_PARTS = {
  INTRODUCTION: `You are an AI assistant specializing in extracting information from invoices.`,
  
  TASK_DESCRIPTION: `Your task is to analyze the invoice data and extract the following information:
1. Amount Netto (Net Amount): This is the total amount before taxes. Look for labels such as "Net Total", "Subtotal", or "Amount Before Tax".
2. VAT (Value Added Tax): This is the tax amount. Look for labels such as "VAT", "Tax", or "GST".
3. Amount Brutto (Gross Amount): This is the total amount including taxes. Look for labels such as "Total", "Grand Total", or "Amount Due".`,
  
  RULES: `Please follow these rules:
• Always provide numerical values without currency symbols.
• Use decimal points for fractional amounts (e.g., 100.50).
• If multiple VAT rates are present, sum them up into a single value.
• If the invoice is in a different currency, convert all amounts to the invoice's primary currency.
• If you're unsure about a value, use "N/A" instead of guessing.`,
  
  OUTPUT_FORMAT: `Provide the extracted information in the specified JSON format.`
};

// Function to build the full prompt
function buildFullPrompt() {
  return Object.values(PROMPT_PARTS).join('\n\n');
}

export async function POST(req: Request) {
  console.log('POST request received in invoice-processor');
  const { prompt } = await req.json();
  console.log('Received prompt length:', prompt.length);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildFullPrompt() },
        { role: "user", content: `Here are the invoice data to process. Extract the required information and provide it in the specified JSON format.\n\nInvoice data:\n${prompt}` },
      ],
      response_format: zodResponseFormat(InvoiceData, "invoice"),
    });

    const invoice = JSON.parse(completion.choices[0].message.content);
    console.log('Successfully parsed AI response:', invoice);

    return NextResponse.json(invoice, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error processing invoice data:', error);
    return NextResponse.json({ error: 'Failed to process invoice data' }, { status: 500 });
  }
}

export const config = {
  runtime: 'edge',
};