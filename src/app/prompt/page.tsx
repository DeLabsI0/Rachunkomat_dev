'use client';

import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '@/config/firebase';

const DEFAULT_PROMPT = `
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
Provide only the JSON object without any additional text or formatting.
`;

export default function PromptPage() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    const db = getFirestore(app);
    const promptDoc = await getDoc(doc(db, 'settings', 'prompt'));
    if (promptDoc.exists()) {
      setPrompt(promptDoc.data().text);
    }
  };

  const handleSavePrompt = async () => {
    setIsSaving(true);
    try {
      const db = getFirestore(app);
      await setDoc(doc(db, 'settings', 'prompt'), { text: prompt });
      alert('Prompt saved successfully!');
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Parsing Prompt</h1>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-96 p-2 border rounded mb-4"
      />
      <button
        onClick={handleSavePrompt}
        disabled={isSaving}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {isSaving ? 'Saving...' : 'Save Prompt'}
      </button>
    </div>
  );
}