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

  const renderField = (key: string, value: any, path: string = '') => {
    if (key === 'pozycjeFaktury') {
      return renderPozycjeFaktury(value);
    } else if (Array.isArray(value)) {
      return (
        <div key={path} className="mb-4">
          <label className="block text-sm font-medium text-gray-700">{key}:</label>
          {value.map((item, index) => (
            <div key={`${path}[${index}]`} className="ml-4 mt-2 p-2 border rounded">
              {renderField(`Item ${index + 1}`, item, `${path}[${index}]`)}
            </div>
          ))}
        </div>
      );
    } else if (typeof value === 'object' && value !== null) {
      return (
        <div key={path} className="mb-4">
          <label className="block text-sm font-medium text-gray-700">{key}:</label>
          <div className="ml-4">
            {Object.entries(value).map(([subKey, subValue]) => 
              renderField(subKey, subValue, path ? `${path}.${subKey}` : subKey)
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div key={path} className="mb-4">
          <label className="block text-sm font-medium text-gray-700">{key}:</label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(path, e.target.value)}
            className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
      );
    }
  };

  const renderPozycjeFaktury = (items: any[]) => {
    if (!items || items.length === 0) return null;

    const headers = Object.keys(items[0]);

    return (
      <div className="mb-4 overflow-x-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">Pozycje Faktury:</label>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index}>
                {headers.map((header) => (
                  <td key={`${index}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="text"
                      value={item[header]}
                      onChange={(e) => handlePozycjeFakturyChange(index, header, e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleInputChange = (path: string, value: string) => {
    if (parsedResponse) {
      const newResponse = { ...parsedResponse };
      let current = newResponse;
      const keys = path.split('.');
      for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i].includes('[')) {
          const [arrayKey, indexStr] = keys[i].split('[');
          const index = parseInt(indexStr.replace(']', ''));
          if (!current[arrayKey]) current[arrayKey] = [];
          if (!current[arrayKey][index]) current[arrayKey][index] = {};
          current = current[arrayKey][index];
        } else {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
      }
      current[keys[keys.length - 1]] = value;
      setParsedResponse(newResponse);
    }
  };

  const handlePozycjeFakturyChange = (index: number, field: string, value: string) => {
    if (parsedResponse && parsedResponse.pozycjeFaktury) {
      const newPozycjeFaktury = [...parsedResponse.pozycjeFaktury];
      newPozycjeFaktury[index] = { ...newPozycjeFaktury[index], [field]: value };
      setParsedResponse({ ...parsedResponse, pozycjeFaktury: newPozycjeFaktury });
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
          {Object.entries(parsedResponse).map(([key, value]) => 
            key !== 'pozycjeFaktury' ? renderField(key, value, key) : null
          )}
          {parsedResponse.pozycjeFaktury && renderPozycjeFaktury(parsedResponse.pozycjeFaktury)}
        </div>
      )}
    </div>
  );
}