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

// Podział prompta na logiczne części
const PROMPT_PARTS = {
  INTRODUCTION: `Jesteś asystentem AI specjalizującym się w wyciąganiu informacji z faktur.`,
  
  TASK_DESCRIPTION: `Twoim zadaniem jest analiza danych z faktury i wyciągnięcie następujących informacji:
1. Kwota Netto: To jest całkowita kwota przed opodatkowaniem. Szukaj etykiet takich jak "Suma Netto", "Podsumowanie Netto" lub "Kwota przed podatkiem".
2. VAT (Podatek od towarów i usług): To jest kwota podatku. Szukaj etykiet takich jak "VAT", "Podatek" lub "GST".
3. Kwota Brutto: To jest całkowita kwota z podatkiem. Szukaj etykiet takich jak "Razem", "Suma całkowita" lub "Kwota do zapłaty".`,
  
  RULES: `Proszę przestrzegać następujących zasad:
• Zawsze podawaj wartości liczbowe bez symboli walutowych.
• Używaj przecinków dziesiętnych dla wartości ułamkowych (np. 100,50).
• Jeśli występuje wiele stawek VAT, zsumuj je w jedną wartość.
• Jeśli faktura jest w innej walucie, przelicz wszystkie kwoty na główną walutę faktury.
• Jeśli nie jesteś pewien wartości, użyj "N/D" zamiast zgadywać.`,
  
  OUTPUT_FORMAT: `Podaj wyciągnięte informacje w określonym formacie JSON.`
};

// Funkcja do składania pełnego prompta
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
        { role: "user", content: `Oto dane faktury do przetworzenia. Wyciągnij wymagane informacje i podaj je w określonym formacie JSON.\n\nDane faktury:\n${prompt}` },
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