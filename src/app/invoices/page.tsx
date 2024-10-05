'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '../../lib/firebase/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

interface Invoice {
  id: string;
  userId: string;
  name: string;
  fileName: string;
  fullPath: string;
  textractProcessed: boolean;
  openAIProcessed: boolean;
  textractData?: any;
  openAIData?: any;
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
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null);
  const [userId, setUserId] = useState<string>("example-user-id");

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

  const fetchInvoiceMetadata = async (invoiceName: string): Promise<Partial<Invoice>> => {
    const invoiceRef = collection(db, 'invoices');
    const querySnapshot = await getDocs(invoiceRef);
    const invoice = querySnapshot.docs.find(doc => doc.id === invoiceName);
    if (invoice) {
      return invoice.data() as Partial<Invoice>;
    }
    return {};
  };

  const fetchInvoices = async () => {
    try {
      const invoicesRef = collection(db, 'invoices');
      const q = query(invoicesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const invoicesData = querySnapshot.docs.map(doc => {
        const data = doc.data() as Invoice;
        return {
          ...data,
          id: doc.id
        };
      });
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
        const id = uuidv4();
        const fileName = `${id}_${file.name}`;
        const storageRef = ref(storage, `invoices/${fileName}`);
        uploadPromises.push(
          uploadBytes(storageRef, file).then(() => {
            return storeInvoiceMetadata(id, file.name, fileName);
          })
        );
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

  const handleCheckboxChange = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedInvoices(invoices.map(invoice => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedInvoices.length === 0) return;
    setDeleting(true);
    try {
      await Promise.all(selectedInvoices.map(async (invoiceId) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
          const invoiceRef = ref(storage, invoice.fullPath);
          await deleteObject(invoiceRef);
          await deleteInvoiceMetadata(invoiceId);
        }
      }));
      await fetchInvoices();
      setSelectedInvoices([]);
    } catch (error) {
      console.error('Error deleting invoices:', error);
    } finally {
      setDeleting(false);
    }
  };

  const deleteInvoiceMetadata = async (invoiceId: string) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await deleteDoc(invoiceRef);
  };

  const storeTextractDataInFirebase = async (invoiceId: string, data: any) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await setDoc(invoiceRef, { textractData: data }, { merge: true });
  };

  const fetchTextractDataFromFirebase = async (invoiceId: string) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);
    if (invoiceDoc.exists()) {
      return invoiceDoc.data().textractData;
    }
    return null;
  };

  const storeOpenAIDataInFirebase = async (invoiceId: string, data: any) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await setDoc(invoiceRef, { openAIData: data }, { merge: true });
  };

  const fetchOpenAIDataFromFirebase = async (invoiceId: string) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);
    if (invoiceDoc.exists()) {
      return invoiceDoc.data().openAIData;
    }
    return null;
  };

  const updateInvoiceMetadata = async (invoiceId: string, metadata: Partial<Invoice>) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await updateDoc(invoiceRef, metadata);
  };

  const fetchInvoiceData = async (invoiceId: string) => {
    try {
      const invoiceRef = doc(db, 'invoices', invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);
      if (invoiceDoc.exists()) {
        return invoiceDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      return null;
    }
  };

  const handleInvoiceClick = async (invoice: Invoice) => {
    console.log(`Invoice clicked: ${invoice.name}`);
    setSelectedInvoice(invoice);
    setTextractData(null);
    setExtractedData(null);
    setError(null);

    const invoiceData = await fetchInvoiceData(invoice.id);
    console.log('Fetched invoice data:', invoiceData);
    setSelectedInvoiceData(invoiceData);

    if (invoiceData?.textractData) {
      console.log('Setting Textract data');
      setTextractData(invoiceData.textractData);
    }

    if (invoiceData?.openAIData) {
      console.log('Setting OpenAI data');
      setExtractedData(invoiceData.openAIData);
    }

    loadPdf(invoice.fullPath);
  };

  const handleProcessInvoice = async () => {
    if (!selectedInvoice) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Performing Textract processing');
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

      // Store Textract data in Firebase
      await storeTextractDataInFirebase(selectedInvoice.id, ocrData.textractResponse);

      // Update invoice metadata
      await updateInvoiceMetadata(selectedInvoice.id, { textractProcessed: true });

      // After processing, update selectedInvoiceData
      const updatedData = await fetchInvoiceData(selectedInvoice.id);
      setSelectedInvoiceData(updatedData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const processWithGPT = async (includeGeometry: boolean) => {
    if (!selectedInvoice) return;

    setIsGPTProcessing(true);
    setExtractedData(null);
    setError(null);

    try {
      console.log('Performing OpenAI processing');
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

      // Store OpenAI data in Firebase
      await storeOpenAIDataInFirebase(selectedInvoice.id, aiData);

      // Update invoice metadata
      await updateInvoiceMetadata(selectedInvoice.id, { openAIProcessed: true });

      // After processing, update selectedInvoiceData
      const updatedData = await fetchInvoiceData(selectedInvoice.id);
      setSelectedInvoiceData(updatedData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during GPT processing');
    } finally {
      setIsGPTProcessing(false);
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

  const redoOpenAI = async () => {
    if (selectedInvoice) {
      await updateInvoiceMetadata(selectedInvoice.id, { openAIProcessed: false });
      await processWithGPT(false);
    }
  };

  const storeInvoiceMetadata = async (id: string, name: string, fileName: string) => {
    const invoiceRef = doc(db, 'invoices', id);
    await setDoc(invoiceRef, {
      id,
      userId,
      name,
      fileName,
      fullPath: `invoices/${fileName}`,
      textractProcessed: false,
      openAIProcessed: false,
    });
  };

  return (
    <div className="w-full bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 px-4">Invoice Management</h1>
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/5 p-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Upload Invoices</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-300 ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
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
            <p className="mt-1 text-sm text-gray-600">Drag and drop your invoices here, or click to select files</p>
            <p className="text-xs text-gray-500">Only PDF files are allowed</p>
          </div>
          {uploading && <p className="mt-2 text-center text-blue-500">Uploading...</p>}
          
          <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-700">Uploaded Invoices</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-2 border-b flex justify-between items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedInvoices.length === invoices.length}
                  onChange={handleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </label>
              <button
                onClick={handleDeleteSelected}
                className={`text-red-500 hover:text-red-700 transition-colors duration-300 ${selectedInvoices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={selectedInvoices.length === 0 || deleting}
              >
                Delete
              </button>
            </div>
            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {invoices.map((invoice) => (
                  <motion.li
                    key={invoice.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center p-3 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => handleCheckboxChange(invoice.id)}
                      className="mr-3"
                    />
                    <button 
                      onClick={() => handleInvoiceClick(invoice)}
                      className="flex items-center flex-grow text-left"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150 truncate">{invoice.name}</span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </div>
        
        <div className="w-full lg:w-1/5 p-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Process Invoice</h2>
          <button
            onClick={handleProcessInvoice}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300 mb-2"
            disabled={!selectedInvoice || isLoading}
          >
            {isLoading ? 'Processing...' : 'Process OCR'}
          </button>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          
          {textractData && (
            <div className="space-y-2">
              <button
                onClick={() => handleDownloadJSON(false)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
              >
                Download JSON (No Geometry)
              </button>
              <button
                onClick={() => processWithGPT(false)}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                disabled={isGPTProcessing}
              >
                {isGPTProcessing ? 'Processing...' : 'Process Fields'}
              </button>
            </div>
          )}
          
          {extractedData && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Extracted Data:</h2>
              <div className="bg-white p-2 rounded shadow overflow-auto max-h-[calc(100vh-400px)]">
                {renderNestedObject(extractedData)}
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full lg:w-3/5 p-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Invoice Preview</h2>
          {selectedInvoice ? (
            <div>
              <div className="bg-white rounded-lg">
                <canvas ref={canvasRef} className="mx-auto max-w-full"></canvas>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-l transition-colors duration-300"
                    >
                      Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => {
                        console.log("button clicked"); // Log message to console
                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      }}
                      disabled={currentPage === totalPages}
                      className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-r transition-colors duration-300"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg text-center">
              <p className="text-gray-600">Select an invoice to preview its contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}