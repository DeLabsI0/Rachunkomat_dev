'use client';

import { useState } from 'react';

export default function OCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'textract-result.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
          {loading ? 'Processing...' : 'Analyze Document'}
        </button>
      </form>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Analysis Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
          <button 
            onClick={handleDownload}
            className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
}