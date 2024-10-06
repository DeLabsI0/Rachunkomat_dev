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
  wartoscBrutto: z.number().describe("Gross value of the invoice"),
  kwotaVAT: z.number().describe("VAT amount of the invoice, sometimes it's not present on the invoice, in that case use 0."),
  wartoscNetto: z.number().describe("Net value of the invoice"),
  walutaFaktury: z.string().describe("Currency of the invoice in ISO 4217 format (e.g., PLN, EUR, USD)"),
  numerFaktury: z.string().describe("Invoice number"),
  dataWystawienia: z.string().describe("Date of invoice issuance (YYYY-MM-DD)"),
  dataSprzedazy: z.string().describe("Date of sale (YYYY-MM-DD)"),
  terminPlatnosci: z.string().describe("Payment due date (YYYY-MM-DD), even if it's on the invoice but is sooner than dataSprzedazy, use dataSprzedazy."),
  sprzedawca: z.object({
    nazwa: z.string().describe("Name of the seller"),
    ulica: z.string().describe("Street and house number of the seller"),
    kodPocztowy: z.string().describe("Postal code of the seller in Polish format (e.g., 00-000)"),
    miasto: z.string().describe("City of the seller"),
    nip: z.string().describe("Tax ID of the seller in Polish format (e.g., 123-456-78-90)"),
  }),
  nabywca: z.object({
    nazwa: z.string().describe("Name of the buyer. In polish this would be a company name. On invoice labled ofter with 'Nabywca' or 'Klient'"),
    ulica: z.string().describe("Street and house number of the buyer"),
    kodPocztowy: z.string().describe("Postal code of the buyer in Polish format (e.g., 00-000)"),
    miasto: z.string().describe("City of the buyer"),
    nip: z.string().describe("Tax ID of the buyer in Polish format (e.g., 123-456-78-90)"),
  }),
  pozycjeFaktury: z.array(z.object({
    nazwa: z.string().describe("Name of the item"),
    ilosc: z.number().describe("Quantity of the item"),
    jednostka: z.string().describe("Unit of the item"),
    cenaJednostkowa: z.number().describe("Unit price of the item"),
    wartoscNetto: z.number().describe("Net value of the item"),
    stawkaVAT: z.string().describe("VAT rate of the item"),
  })),
  numerKontaBankowego: z.string().describe("Bank account number in iban format (e.g., PL61109010140000071234567890) or in Polish format (e.g., 1090100000712345678900000000)"),
  nrRejestracyjny: z.string().describe("Vehicle registration number in Polish format (e.g., WE 9C449). Present only in case of car related invoices."),
});


const GIDE_PROMPT = `You are an AI assistant specializing in extracting information from invoices. Your task is to analyze the invoice data and extract information. 
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