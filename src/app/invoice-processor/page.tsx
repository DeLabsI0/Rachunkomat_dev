'use client';

import { useState } from 'react';
import { useCompletion } from 'ai/react';

interface InvoiceData {
  amountNetto: string;
  vat: string;
  amountBrutto: string;
}

export default function InvoiceProcessor() {
  const [invoiceData, setInvoiceData] = useState('');
  const [parsedResponse, setParsedResponse] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { complete } = useCompletion({
    api: '/api/invoice-processor', // This is the correct path
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileUpload called');
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log('File read complete');
        setInvoiceData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called');
    setIsLoading(true);
    setError(null);
    setParsedResponse(null);
    try {
      console.log('Sending invoice data to AI');
      console.log('Invoice data:', invoiceData);
      const result = await complete(invoiceData);
      console.log('Raw AI response received:', result);

      // Attempt to parse the result
      try {
        const parsedResult = JSON.parse(result);
        console.log('Successfully parsed AI response:', parsedResult);
        setParsedResponse(parsedResult);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Unparseable AI response:', result);
        setError('Failed to parse AI response. Please try again.');
      }
    } catch (error) {
      console.error('Error processing invoice:', error);
      setError('Failed to process invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof InvoiceData, value: string) => {
    if (parsedResponse) {
      setParsedResponse({ ...parsedResponse, [field]: value });
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
      {parsedResponse && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Extracted Invoice Data:</h2>
          <form className="space-y-4">
            {Object.entries(parsedResponse).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <label htmlFor={key} className="w-1/3 text-right mr-2">{key}:</label>
                <input
                  type="text"
                  id={key}
                  value={value}
                  onChange={(e) => handleInputChange(key as keyof InvoiceData, e.target.value)}
                  className="w-2/3 p-2 border rounded"
                />
              </div>
            ))}
          </form>
        </div>
      )}
    </div>
  );
}