'use client';

import { useState } from 'react';
import { useCompletion } from 'ai/react';

export default function InvoiceProcessor() {
  const [invoiceData, setInvoiceData] = useState('');
  const [parsedResult, setParsedResult] = useState<any>(null);

  const { complete } = useCompletion({
    api: '/api/invoice-processor',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await complete(invoiceData);
      const parsedJson = JSON.parse(result);
      setParsedResult(parsedJson);
    } catch (error) {
      console.error('Error processing invoice:', error);
      setParsedResult({ error: 'Failed to process invoice' });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Invoice Processor</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          className="w-full h-40 p-2 border rounded"
          value={invoiceData}
          onChange={(e) => setInvoiceData(e.target.value)}
          placeholder="Paste your invoice JSON data here..."
        />
        <button
          type="submit"
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Process Invoice
        </button>
      </form>
      {parsedResult && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Extracted Information:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(parsedResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}