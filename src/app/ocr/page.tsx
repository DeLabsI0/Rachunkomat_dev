'use client';

import { useState } from 'react';

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    // TODO: Implement OCR processing logic here
    // This is where you'd typically send the file to your backend for OCR processing
    // For now, we'll just simulate a delay and set a dummy result
    await new Promise(resolve => setTimeout(resolve, 2000));
    setResult('OCR result will appear here.');

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">OCR Processing</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="mb-2 block"
          accept="image/*,.pdf"
        />
        <button 
          type="submit" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={!file || loading}
        >
          {loading ? 'Processing...' : 'Process Image'}
        </button>
      </form>
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded">{result}</pre>
        </div>
      )}
    </div>
  );
}