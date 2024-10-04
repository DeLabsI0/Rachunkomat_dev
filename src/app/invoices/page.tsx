'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase/firebase';

interface Invoice {
  name: string;
  fullPath: string;
}

interface InvoiceData {
  [key: string]: any;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const [extractedData, setExtractedData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textractData, setTextractData] = useState<any>(null);
  const [isGPTProcessing, setIsGPTProcessing] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (selectedInvoice) {
      loadPdf(selectedInvoice.fullPath);
    }
  }, [selectedInvoice]);

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(currentPage);
    }
  }, [currentPage]);

  const fetchInvoices = async () => {
    const invoicesRef = ref(storage, 'invoices');
    try {
      const invoicesList = await listAll(invoicesRef);
      const invoicesData = invoicesList.items.map((item) => ({
        name: item.name,
        fullPath: item.fullPath,
      }));
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const loadPdf = async (fullPath: string) => {
    try {
      const response = await fetch(`/api/fetch-pdf?path=${encodeURIComponent(fullPath)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }
      const arrayBuffer = await response.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      renderPage(1);
    } catch (err) {
      console.error('Error loading PDF:', err);
    }
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
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const uploadPromises = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        const storageRef = ref(storage, `invoices/${file.name}`);
        uploadPromises.push(uploadBytes(storageRef, file));
      }
    }
    try {
      await Promise.all(uploadPromises);
      await fetchInvoices();
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleCheckboxChange = (invoiceName: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceName)
        ? prev.filter(name => name !== invoiceName)
        : [...prev, invoiceName]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map(invoice => invoice.name));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedInvoices.length === 0) return;
    setDeleting(true);
    try {
      await Promise.all(selectedInvoices.map(async (invoiceName) => {
        const invoiceRef = ref(storage, `invoices/${invoiceName}`);
        await deleteObject(invoiceRef);
      }));
      await fetchInvoices();
      setSelectedInvoices([]);
    } catch (error) {
      console.error('Error deleting invoices:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleProcessInvoice = async () => {
    if (!selectedInvoice) return;

    setIsLoading(true);
    setExtractedData(null);
    setError(null);
    setTextractData(null);

    try {
      // Step 1: OCR Processing
      const formData = new FormData();
      formData.append('path', selectedInvoice.fullPath);

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

  const handleDownloadJSON = (includeGeometry: boolean) => {
    if (textractData) {
      let dataToDownload = includeGeometry ? textractData : removeGeometry(textractData);
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Invoices</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Upload New Invoices</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf"
                onChange={handleChange}
                className="hidden"
              />
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1">Drag and drop your invoices here, or click to select files</p>
              <p className="text-xs text-gray-500">Only PDF files are allowed</p>
            </div>
            {uploading && <p className="mt-2 text-center">Uploading...</p>}
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Uploaded Invoices</h2>
          </div>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === invoices.length}
                  onChange={handleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Select All</span>
              </label>
              <button
                onClick={handleDeleteSelected}
                className={`text-red-500 hover:text-red-700 ${selectedInvoices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={selectedInvoices.length === 0 || deleting}
              >
                ×
              </button>
            </div>
            <ul className="divide-y divide-gray-200">
              {invoices.map((invoice, index) => (
                <li key={index} className="flex items-center p-4">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.name)}
                    onChange={() => handleCheckboxChange(invoice.name)}
                    className="mr-2"
                  />
                  <button 
                    onClick={() => setSelectedInvoice(invoice)}
                    className="flex items-center hover:bg-gray-50 transition-colors duration-150 flex-grow text-left"
                  >
                    <svg className="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-blue-600 hover:text-blue-800">{invoice.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="w-full md:w-1/4">
          <h2 className="text-xl font-semibold mb-4">Process Invoice</h2>
          <button
            onClick={handleProcessInvoice}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
            disabled={!selectedInvoice || isLoading}
          >
            {isLoading ? 'Processing...' : 'Process Invoice'}
          </button>
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
              <div className="bg-white p-4 rounded shadow overflow-auto max-h-[calc(100vh-300px)]">
                {renderNestedObject(extractedData)}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-2/4">
          <h2 className="text-xl font-semibold mb-4">Invoice Preview</h2>
          {selectedInvoice ? (
            <div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <canvas ref={canvasRef} className="mx-auto"></canvas>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
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
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p className="text-gray-600">Select an invoice to preview its contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}