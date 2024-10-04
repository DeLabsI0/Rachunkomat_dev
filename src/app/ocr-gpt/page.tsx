'use client';

import { useState } from 'react';

interface InvoiceData {
  amountNetto: string;
  vat: string;
  amountBrutto: string;
}

export default function OCRGPTPage() {
  const [file, setFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setOcrResult(null);
    setExtractedData(null);
    setError(null);

    try {
      // Step 1: OCR Processing
      const formData = new FormData();
      formData.append('file', file);

      const ocrResponse = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) {
        throw new Error('Failed to analyze document');
      }

      const ocrData = await ocrResponse.json();
      setOcrResult(ocrData);

      // Step 2: OpenAI Extraction
      const aiResponse = await fetch('/api/invoice-processor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: JSON.stringify(ocrData) }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to process invoice data');
      }

      const aiData = await aiResponse.json();
      setExtractedData(aiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof InvoiceData, value: string) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, [field]: value });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">OCR & GPT Invoice Processing</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-4">
          <label htmlFor="invoiceFile" className="block text-sm font-medium text-gray-700">
            Upload Invoice File (Image or PDF)
          </label>
          <input
            type="file"
            id="invoiceFile"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={!file || isLoading}
        >
          {isLoading ? 'Processing...' : 'Process Invoice'}
        </button>
      </form>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {ocrResult && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">OCR Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">{JSON.stringify(ocrResult, null, 2)}</pre>
        </div>
      )}
      {extractedData && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Extracted Invoice Data:</h2>
          <form className="space-y-4">
            {Object.entries(extractedData).map(([key, value]) => (
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