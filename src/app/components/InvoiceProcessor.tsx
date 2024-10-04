import { useState } from 'react';

interface InvoiceData {
  [key: string]: any;
}

export default function InvoiceProcessor() {
  const [result, setResult] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<string>('');

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

      const rawData = await response.text();
      setRawResponse(rawData);

      const data: InvoiceData = JSON.parse(rawData);
      setResult(data);
      setError(null);
    } catch (err) {
      console.error('Error processing invoice:', err);
      setError('Failed to process invoice. Please try again.');
      setResult(null);
    }
  };

  const renderField = (key: string, value: any) => {
    return (
      <div key={key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700">{key}:</label>
        {typeof value === 'object' ? (
          <pre className="mt-1 block w-full p-2 border rounded-md bg-gray-50 text-sm">
            {JSON.stringify(value, null, 2)}
          </pre>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        )}
      </div>
    );
  };

  const handleInputChange = (key: string, value: string) => {
    if (result) {
      setResult({ ...result, [key]: value });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <textarea
        value={invoiceData}
        onChange={(e) => setInvoiceData(e.target.value)}
        placeholder="Paste your invoice data here"
        rows={10}
        className="w-full p-2 border rounded mb-4"
      />
      <button 
        onClick={processInvoice}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Process Invoice
      </button>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {rawResponse && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Raw API Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">{rawResponse}</pre>
        </div>
      )}

      {result && (
        <div>
          <h2 className="text-xl font-bold mb-4">Extracted 111 Invoice Data:</h2>
          {Object.entries(result).map(([key, value]) => renderField(key, value))}
        </div>
      )}
    </div>
  );
}