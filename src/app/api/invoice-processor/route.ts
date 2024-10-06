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
  wartoscBrutto: z.number(),
  kwotaVAT: z.number(),
  wartoscNetto: z.number(),
  walutaFaktury: z.string(),
  numerFaktury: z.string(),
  dataWystawienia: z.date(), // Changed back to z.string()
  dataSprzedazy: z.date(), // Changed back to z.string()
  terminPlatnosci: z.date(),
  sprzedawca: z.object({
    nazwa: z.string(),
    ulica: z.string(),
    kodPocztowy: z.string(),
    nip: z.string(),
  }),
  nabywca: z.object({
    nazwa: z.string(),
    ulica: z.string(),
    kodPocztowy: z.string(),
    nip: z.string(),
  }),
  pozycjeFaktury: z.array(z.object({
    nazwa: z.string(),
    ilosc: z.number(),
    jednostka: z.string(),
    cenaJednostkowa: z.number(),
    wartoscNetto: z.number(),
    stawkaVAT: z.string(),
  })),
  numerKontaBankowego: z.string(),
  nrRejestracyjny: z.string(),
});

// Single prompt string
const PROMPT_a = `You are an AI assistant specializing in extracting information from invoices. Your task is to analyze the invoice data and extract the following information:

1. amountNetto: This is the total amount before taxes. Look for labels such as "Net Total", "Subtotal", "Amount Before Tax", "Suma", or "do zapłaty".
2. vat: This is the tax amount. Look for labels such as "VAT", "Tax", or "GST".
3. amountBrutto: This is the total amount including taxes. Look for labels such as "Total", "Grand Total", or "Amount Due".

Please follow these rules:
• Always provide numerical values without currency symbols.
• Use decimal points for fractional amounts (e.g., 100.50).
• If multiple VAT rates are present, sum them up into a single value.
• If the invoice is in a different currency, convert all amounts to the invoice's primary currency.
• amountNetto + vat = amountBrutto, but not always all 3 amounts are present on the invoice.
• amountBrutto should always be on the invoice.
• amountNetto or vat is not always on the invoice.
• If you're unsure about a value, use "N/A" instead of guessing.

Provide the extracted information in the specified JSON format. 
Double-check if all rules are followed before providing the final output.
Double check if amountNetto + vat = amountBrutto in the final output.
`;

const GIDE_PROMPT = `You are an AI assistant specializing in extracting information from invoices. Your task is to analyze the invoice data and extract information.
Can you please extract buyer and seller data like: name, adress, nip number, netto amount and brutto amounts, pozycjeFaktury: An array of invoice items, rRejestracyjny: The vehicle registration in case of invoices related to vehicles. 
`;

const GIDE_PROMPT_2 = `You are an AI assistant specializing in extracting information from invoices. Your task is to analyze the invoice data and extract the following information:

wartoscBrutto -> Brutto Amount
kwotaVAT -> This total tax amount, if invoices if you can't find it, use 0.
wartoscNetto -> this is Netto amount before taxes. If you can't find it, calculate it from amountBrutto and vat.
numerFaktury: The invoice number.
dataWystawienia: The date the invoice was issued.
dataSprzedazy: The date of sale.
terminPlatnosci: The payment due date. even if it's on the invoice but is sooner than dataSprzedazy, use dataSprzedazy.
sprzedawca: Information about the seller Sprzedawca (nazwa: name, adres: address, nip: tax ID).
nabywca: Information about the buyer Nabywca (nazwa: name, adres: address, nip: tax ID).
pozycjeFaktury: An array of invoice items, each containing (nazwa: name, ilosc: quantity, jednostka: unit, cenaJednostkowa: unit price, wartoscNetto: net value, stawkaVAT: VAT rate).
numerKontaBankowego: Bank account number.
nrRejestracyjny: The vehicle registration number. If you can't find it leave it empty. in polish format like WE 9C449.
`;

export async function POST(req: Request) {
  console.log('POST request received in invoice-processor');
  const { prompt } = await req.json();
  console.log('Received prompt length:', prompt.length);
  //console.log('content:', GIDE_PROMPT);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: GIDE_PROMPT },
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