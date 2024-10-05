'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, db } from '../../lib/firebase/firebase';
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
  documentData?: any; // Add this line
  dataWystawienia?: string; // Add this line
}

interface InvoiceData {
  [key: string]: any;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Add this configuration for PDF.js
if (typeof window !== 'undefined' && 'pdfjsLib' in window) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${window.pdfjsLib.version}/pdf.worker.min.js`;
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
  const [expandedColumns, setExpandedColumns] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [lastClickedInvoiceId, setLastClickedInvoiceId] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderTaskRef = useRef<any>(null);
  const [documentData, setDocumentData] = useState<any>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (selectedInvoice) {
      console.log('[useEffect loadPdf] selectedInvoice :');
      loadPdf(selectedInvoice.fullPath);
    }
  }, [selectedInvoice]);

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    console.log(`[useEffect] activeIndex changed to: ${activeIndex}`);
    if (activeIndex >= 0 && activeIndex < invoices.length) {
      const invoice = invoices[activeIndex];
      console.log(`[useEffect] Updating selected invoice: ${invoice.id}`);
      setSelectedInvoice(invoice);
    }
  }, [activeIndex, invoices]);

  useEffect(() => {
    if (selectedInvoice) {
      console.log(`[useEffect] Selected invoice changed: ${selectedInvoice.id}`);
      handleInvoiceData(selectedInvoice);
    }
  }, [selectedInvoice]);

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
          id: doc.id,
          dataWystawienia: data.dataWystawienia || 'N/A' // Add this line
        };
      });
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const loadPdf = async (fullPath: string) => {
    try {
        console.log('[inside of loadPdf] fullPath :', fullPath);
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
    if (!pdfDocRef.current || isRendering) return;

    // Cancel any ongoing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    setIsRendering(true);

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

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
      }
    } catch (err) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Error rendering PDF page:', err);
      }
    } finally {
      setIsRendering(false);
      renderTaskRef.current = null;
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

  const handleInvoiceClick = useCallback((invoice: Invoice) => {
    console.log(`[handleInvoiceClick] Invoice clicked: ${invoice.name} (ID: ${invoice.id})`);
    const newIndex = invoices.findIndex(inv => inv.id === invoice.id);
    setActiveIndex(newIndex);
  }, [invoices]);

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

      // Fetch existing documentData
      const existingDocumentData = await fetchDocumentDataFromFirebase(selectedInvoice.id);

      // Create new documentData by merging existing data with new aiData
      const newDocumentData = mergeDocumentData(existingDocumentData, aiData);
      setDocumentData(newDocumentData);

      // Store OpenAI data in Firebase
      await storeOpenAIDataInFirebase(selectedInvoice.id, aiData);

      // Store merged documentData in Firebase
      await storeDocumentDataInFirebase(selectedInvoice.id, newDocumentData);

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

  // Add this new helper function to merge documentData
  const mergeDocumentData = (existingData: any, newData: any): any => {
    const mergedData = { ...existingData };

    for (const [key, value] of Object.entries(newData)) {
      if (!(key in mergedData) || mergedData[key] === null || mergedData[key] === undefined) {
        if (Array.isArray(value)) {
          mergedData[key] = value.map((item, index) => 
            mergeDocumentData(mergedData[key]?.[index] || {}, item)
          );
        } else if (typeof value === 'object' && value !== null) {
          mergedData[key] = mergeDocumentData(mergedData[key] || {}, value);
        } else {
          mergedData[key] = value;
        }
      }
    }

    return mergedData;
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

  const renderNestedObject = (obj: any, prefix = '') => (
    <div className="ml-4">
      {Object.entries(obj).map(([key, value]) => (
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
      ))}
    </div>
  );

  const renderArray = (arr: any[], prefix: string) => (
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

  const toggleExpandColumns = () => {
    setExpandedColumns(!expandedColumns);
  };

  const renderInvoiceRow = (invoice: Invoice, index: number) => (
    <li
      key={invoice.id}
      className={`flex items-center p-3 hover:bg-gray-100 transition-colors duration-150 ${
        index === activeIndex ? 'bg-gray-200' : ''
      } cursor-pointer`}
      onClick={() => handleInvoiceClick(invoice)}
    >
      <input
        type="checkbox"
        checked={selectedInvoices.includes(invoice.id)}
        onChange={(e) => {
          e.stopPropagation();
          handleCheckboxChange(invoice.id);
        }}
        className="mr-3"
      />
      <div className="flex items-center flex-grow">
        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-150 truncate">{invoice.name}</span>
      </div>
      {expandedColumns && (
        <>
          <span className="text-sm text-gray-600 mx-2">{invoice.textractProcessed ? 'OCR Done' : 'OCR Pending'}</span>
          <span className="text-sm text-gray-600 mx-2">{invoice.openAIProcessed ? 'AI Done' : 'AI Pending'}</span>
          <span className="text-sm text-gray-600 mx-2">{invoice.dataWystawienia}</span> {/* Add this line */}
        </>
      )}
    </li>
  );

  // Modify the handleKeyDown function
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.log('[handleKeyDown] Key pressed:', event.key);
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prevIndex) => {
        let newIndex;
        if (event.key === 'ArrowUp') {
          newIndex = prevIndex > 0 ? prevIndex - 1 : invoices.length - 1;
        } else {
          newIndex = prevIndex < invoices.length - 1 ? prevIndex + 1 : 0;
        }
        console.log(`[handleKeyDown] New active index: ${newIndex}`);
        return newIndex;
      });
    }
  }, [invoices]);

  // Add this useEffect to add and remove the event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Add this useEffect to log when invoices change
  useEffect(() => {
    console.log('[useEffect] Invoices updated:', invoices.map(inv => inv.id));
  }, [invoices]);

  const handleInvoiceData = async (invoice: Invoice) => {
    console.log(`[handleInvoiceData] Processing invoice: ${invoice.id}`);
    setTextractData(null);
    setExtractedData(null);
    setDocumentData(null);
    setError(null);

    const invoiceData = await fetchInvoiceData(invoice.id);
    console.log('[handleInvoiceData] Fetched invoice data:', invoiceData);
    setSelectedInvoiceData(invoiceData);

    if (invoiceData?.textractData) {
      console.log('[handleInvoiceData] Setting Textract data');
      setTextractData(invoiceData.textractData);
    }

    if (invoiceData?.openAIData) {
      console.log('[handleInvoiceData] Setting OpenAI data');
      setExtractedData(invoiceData.openAIData);
    }

    if (invoiceData?.documentData) {
      console.log('[handleInvoiceData] Setting Document data');
      setDocumentData(invoiceData.documentData);
    } else if (invoiceData?.openAIData) {
      // If documentData doesn't exist, create it from openAIData
      const newDocumentData = JSON.parse(JSON.stringify(invoiceData.openAIData));
      setDocumentData(newDocumentData);
      await storeDocumentDataInFirebase(invoice.id, newDocumentData);
    }
  };

  const handleDocumentDataChange = (path: string, value: string) => {
    if (documentData) {
      const newData = { ...documentData };
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
      setDocumentData(newData);
    }
  };

  const saveDocumentData = async () => {
    if (selectedInvoice && documentData) {
      await storeDocumentDataInFirebase(selectedInvoice.id, documentData);
      console.log('Document data saved successfully');
    }
  };

  const renderDocumentData = (obj: any, prefix = '') => (
    <div className="ml-4">
      {Object.entries(obj).map(([key, value]) => (
        <div key={`${prefix}${key}`} className="ml-4">
          <label className="text-sm font-medium text-gray-700">{key}:</label>
          {Array.isArray(value) ? (
            renderArray(value, `${prefix}${key}`)
          ) : typeof value === 'object' && value !== null ? (
            <div className="ml-4">
              {renderDocumentData(value, `${prefix}${key}.`)}
            </div>
          ) : (
            <input
              type="text"
              value={value as string}
              onChange={(e) => handleDocumentDataChange(`${prefix}${key}`, e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          )}
        </div>
      ))}
    </div>
  );

  const storeDocumentDataInFirebase = async (invoiceId: string, data: any) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    await setDoc(invoiceRef, { documentData: data }, { merge: true });
  };

  const fetchDocumentDataFromFirebase = async (invoiceId: string) => {
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceDoc = await getDoc(invoiceRef);
    if (invoiceDoc.exists()) {
      return invoiceDoc.data().documentData || {};
    }
    return {};
  };

  return (
    <div className="w-full bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 px-4">Invoice Management</h1>
      <div className={`flex flex-col lg:flex-row ${expandedColumns ? 'lg:space-x-4' : ''}`}>
        <div className={`w-full ${expandedColumns ? 'lg:w-2/5' : 'lg:w-1/5'} p-4 transition-all duration-300`}>
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
          
          <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-700 flex justify-between items-center">
            <span>Uploaded Invoices</span>
            <button
              onClick={toggleExpandColumns}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {expandedColumns ? 'Collapse' : 'Expand'} Columns
            </button>
          </h2>
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
              {expandedColumns && (
                <div className="flex">
                  <span className="text-sm font-medium text-gray-700 mx-2">OCR Status</span>
                  <span className="text-sm font-medium text-gray-700 mx-2">AI Status</span>
                  <span className="text-sm font-medium text-gray-700 mx-2">Data Wystawienia</span> {/* Add this line */}
                </div>
              )}
              <button
                onClick={handleDeleteSelected}
                className={`text-red-500 hover:text-red-700 transition-colors duration-300 ${selectedInvoices.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={selectedInvoices.length === 0 || deleting}
              >
                Delete
              </button>
            </div>
            <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {invoices.map((invoice, index) => renderInvoiceRow(invoice, index))}
            </ul>
          </div>
        </div>
        
        <div className={`w-full ${expandedColumns ? 'lg:w-1/5' : 'lg:w-1/5'} p-4 transition-all duration-300 flex flex-col`}>
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
            <div className="space-y-2 mb-4">
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
            <div className="flex-grow flex flex-col">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Extracted Data:</h2>
              <div className="bg-white p-2 rounded shadow overflow-auto flex-grow">
                {renderNestedObject(extractedData)}
              </div>
            </div>
          )}
          
          {documentData && (
            <div className="flex-grow flex flex-col">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Document Data:</h2>
              <div className="bg-white p-2 rounded shadow overflow-auto flex-grow">
                {renderDocumentData(documentData)}
              </div>
              <button
                onClick={saveDocumentData}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300 mt-4"
              >
                Save Document Data
              </button>
            </div>
          )}
        </div>
        
        <div className={`w-full ${expandedColumns ? 'lg:w-2/5' : 'lg:w-3/5'} p-4 transition-all duration-300`}>
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">Invoice Preview</h2>
            <div className="flex-grow overflow-hidden">
              {selectedInvoice ? (
                <div className="h-full flex flex-col">
                  <div className="flex-grow bg-white rounded-lg overflow-auto">
                    <canvas ref={canvasRef} className="mx-auto max-w-full"></canvas>
                  </div>
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
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-r transition-colors duration-300"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg text-center">
                  <p className="text-gray-600">Select an invoice to preview its contents.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}