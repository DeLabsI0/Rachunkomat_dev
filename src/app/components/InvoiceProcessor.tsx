import { useState } from 'react';

interface InvoiceData {
  amountNetto: string;
  vat: string;
  amountBrutto: string;
}

export default function InvoiceProcessor() {
  const [result, setResult] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<string>('');

  const processInvoice = async () => {
    try {
      const response = await fetch('/api/invoice-processor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: invoiceData }),
      });

      if (!response.ok) {
        throw new Error('Failed to process invoice');
      }

      const data: InvoiceData = await response.json();
      setResult(data);
      setError(null);
    } catch (err) {
      console.error('Error processing invoice:', err);
      setError('Failed to process invoice. Please try again.');
      setResult(null);
    }
  };

  return (
    <div>
      <textarea
        value={invoiceData}
        onChange={(e) => setInvoiceData(e.target.value)}
        placeholder="Paste your invoice data here"
        rows={10}
        className="w-full p-2 border rounded"
      />
      <button 
        onClick={processInvoice}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Process Invoice
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Extracted Invoice Data:</h2>
          <p>Amount Netto: {result.amountNetto}</p>
          <p>VAT: {result.vat}</p>
          <p>Amount Brutto: {result.amountBrutto}</p>
        </div>
      )}
    </div>
  );
}