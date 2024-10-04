'use client';

import { useState } from 'react';

interface InvoiceData {
  [key: string]: any;
}

export default function InvoiceProcessorPage() {
  const [invoiceData, setInvoiceData] = useState('');
  const [parsedResponse, setParsedResponse] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInvoiceData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setParsedResponse(null);
    setRawResponse('');

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

      const result = JSON.parse(rawData);
      setParsedResponse(result);
    } catch (error) {
      setError('Failed to process invoice. Please try again.');
    } finally {
      setIsLoading(false);
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
    if (parsedResponse) {
      setParsedResponse({ ...parsedResponse, [key]: value });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Invoice Processor</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="jsonFile" className="block text-sm font-medium text-gray-700">
            Upload JSON File
          </label>
          <input
            type="file"
            id="jsonFile"
            accept=".json"
            onChange={handleFileUpload}
            className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
          />
        </div>
        <textarea
          className="w-full h-40 p-2 border rounded"
          value={invoiceData}
          onChange={(e) => setInvoiceData(e.target.value)}
          placeholder="Or paste your invoice JSON data here..."
        />
        <button
          type="submit"
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading || !invoiceData}
        >
          {isLoading ? 'Processing...' : 'Process Invoice'}
        </button>
      </form>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      {rawResponse && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Raw API Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">{rawResponse}</pre>
        </div>
      )}

      {parsedResponse && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Extracted Invoice Data:</h2>
          {Object.entries(parsedResponse).map(([key, value]) => renderField(key, value))}
        </div>
      )}
    </div>
  );
}