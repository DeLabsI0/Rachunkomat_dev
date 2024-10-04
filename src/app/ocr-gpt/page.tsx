'use client';

import { useState, useEffect, useRef } from 'react';

interface InvoiceData {
  amountNetto: string;
  vat: string;
  amountBrutto: string;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function OCRGPTPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      // Clean up render task on component unmount
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (file && file.type === 'application/pdf') {
      const timer = setTimeout(() => {
        renderPdf(file);
      }, 100); // Small delay to allow for any pending cancellations
      return () => clearTimeout(timer);
    }
  }, [file]);

  const renderPdf = async (pdfFile: File) => {
    const fileReader = new FileReader();

    fileReader.onload = async function() {
      const typedarray = new Uint8Array(this.result as ArrayBuffer);
      const loadingTask = window.pdfjsLib.getDocument(typedarray);
      
      try {
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (canvas && context) {
          // Clear previous render
          context.clearRect(0, 0, canvas.width, canvas.height);

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          // Start new render task
          renderTaskRef.current = page.render(renderContext);
          await renderTaskRef.current.promise;
        }
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF:', err);
          setError('Failed to render PDF');
        }
      }
    };

    fileReader.readAsArrayBuffer(pdfFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Cancel previous render task if it exists
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null); // Clear any previous errors

      if (selectedFile.type !== 'application/pdf') {
        // Clear the canvas if a non-PDF file is selected
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (canvas && context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
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
      
      {file && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">File Preview:</h2>
          {file.type === 'application/pdf' ? (
            <canvas ref={canvasRef} className="border"></canvas>
          ) : (
            <img src={URL.createObjectURL(file)} alt="Uploaded file" className="max-w-full h-auto" />
          )}
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