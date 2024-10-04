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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const [textractData, setTextractData] = useState<any>(null);
  const [isGPTProcessing, setIsGPTProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (file && file.type === 'application/pdf') {
      loadPdf(file);
    }
  }, [file]);

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(currentPage);
    }
  }, [currentPage]);

  const loadPdf = async (pdfFile: File) => {
    const fileReader = new FileReader();

    fileReader.onload = async function() {
      const typedarray = new Uint8Array(this.result as ArrayBuffer);
      const loadingTask = window.pdfjsLib.getDocument(typedarray);
      
      try {
        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        renderPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF');
      }
    };

    fileReader.readAsArrayBuffer(pdfFile);
  };

  const renderPage = async (pageNumber: number) => {
    if (!pdfDocRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNumber);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      if (canvas && context) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
      }
    } catch (err) {
      console.error('Error rendering PDF page:', err);
      setError('Failed to render PDF page');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setCurrentPage(1);
      setTotalPages(0);

      if (selectedFile.type !== 'application/pdf') {
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
    setTextractData(null);

    try {
      // Step 1: OCR Processing
      const formData = new FormData();
      formData.append('file', file);

      const ocrResponse = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData,
      });

      if (!ocrResponse.ok) {
        throw new Error('Failed to process document');
      }

      const ocrData = await ocrResponse.json();
      setTextractData(ocrData.textractResponse);
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

  const handleDownloadJSON = (includeGeometry: boolean) => {
    if (textractData) {
      let dataToDownload = includeGeometry ? textractData : removeGeometry(textractData);
      // Wrap the data in a textractResponse object
      const wrappedData = { textractResponse: dataToDownload };
      const dataStr = JSON.stringify(wrappedData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = includeGeometry ? 'textract-data-full.json' : 'textract-data-no-geometry.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const removeGeometry = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(removeGeometry);
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== 'Geometry') {
          newObj[key] = removeGeometry(value);
        }
      }
      return newObj;
    }
    return obj;
  };

  const processWithGPT = async (includeGeometry: boolean) => {
    setIsGPTProcessing(true);
    setExtractedData(null);
    setError(null);

    try {
      const dataToProcess = includeGeometry ? textractData : removeGeometry(textractData);
      // Wrap the data in a textractResponse object if it's not already wrapped
      const wrappedData = textractData.textractResponse ? textractData : { textractResponse: dataToProcess };

      const aiResponse = await fetch('/api/invoice-processor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: JSON.stringify(wrappedData) }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to process invoice data');
      }

      const aiData = await aiResponse.json();
      setExtractedData(aiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during GPT processing');
    } finally {
      setIsGPTProcessing(false);
    }
  };

  const renderNestedObject = (obj: any, prefix = '') => {
    return Object.entries(obj).map(([key, value]) => (
      <div key={`${prefix}${key}`} className="ml-4">
        <label className="text-sm font-medium text-gray-700">{key}:</label>
        {Array.isArray(value) ? (
          renderArray(value, `${prefix}${key}`)
        ) : typeof value === 'object' && value !== null ? (
          <div className="ml-4">
            {renderNestedObject(value, `${prefix}${key}.`)}
          </div>
        ) : (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleNestedInputChange(`${prefix}${key}`, e.target.value)}
            className="w-full p-2 border rounded mt-1"
          />
        )}
      </div>
    ));
  };

  const renderArray = (arr: any[], prefix: string) => {
    return (
      <div className="ml-4">
        {arr.map((item, index) => (
          <div key={`${prefix}[${index}]`} className="mt-2 p-2 border rounded">
            <h4 className="font-medium">Item {index + 1}</h4>
            {typeof item === 'object' && item !== null
              ? renderNestedObject(item, `${prefix}[${index}].`)
              : item}
          </div>
        ))}
      </div>
    );
  };

  const handleNestedInputChange = (path: string, value: string) => {
    if (extractedData) {
      const newData = { ...extractedData };
      let current: any = newData;
      const keys = path.split('.');
      for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i].includes('[')) {
          const [arrayName, indexStr] = keys[i].split('[');
          const index = parseInt(indexStr.replace(']', ''));
          current = current[arrayName][index];
        } else {
          current = current[keys[i]];
        }
      }
      current[keys[keys.length - 1]] = value;
      setExtractedData(newData);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-4">OCR & GPT Invoice Processing</h1>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-1/5">
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
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={!file || isLoading}
            >
              {isLoading ? 'Processing...' : 'Process Invoice'}
            </button>
          </form>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          {textractData && (
            <div className="space-y-4">
              <button
                onClick={() => handleDownloadJSON(true)}
                className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Download Full Textract JSON
              </button>
              <button
                onClick={() => handleDownloadJSON(false)}
                className="w-full bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
              >
                Download Textract JSON (No Geometry)
              </button>
              <button
                onClick={() => processWithGPT(true)}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={isGPTProcessing}
              >
                {isGPTProcessing ? 'Processing...' : 'Process with GPT (Full JSON)'}
              </button>
              <button
                onClick={() => processWithGPT(false)}
                className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                disabled={isGPTProcessing}
              >
                {isGPTProcessing ? 'Processing...' : 'Process with GPT (No Geometry)'}
              </button>
            </div>
          )}
          
          {extractedData && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Extracted Invoice Data:</h2>
              <form className="space-y-4">
                {renderNestedObject(extractedData)}
              </form>
            </div>
          )}
        </div>
        
        <div className="w-full lg:w-4/5">
          {file && (
            <div className="mb-4">
              {file.type === 'application/pdf' ? (
                <div className="flex flex-col items-center">
                  <p className="mb-2">PDF document loaded ({totalPages} page{totalPages !== 1 ? 's' : ''})</p>
                  <canvas ref={canvasRef} className="border mb-2 max-w-full h-auto"></canvas>
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center w-full max-w-md mb-4">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"
                      >
                        Previous
                      </button>
                      <span>Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"
                      >
                        Next
                      </button>
                    </div>
                  )}
                  <p className="mt-2">Note: The entire PDF will be processed for OCR analysis.</p>
                </div>
              ) : (
                <img src={URL.createObjectURL(file)} alt="Uploaded file" className="max-w-full h-auto" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}