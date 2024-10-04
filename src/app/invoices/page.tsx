'use client';

import { useState, useEffect } from 'react';
import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase/firebase'; // Updated import path

interface Invoice {
  name: string;
  url: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const invoicesRef = ref(storage, 'invoices');
    try {
      const invoicesList = await listAll(invoicesRef);
      const invoicesData = await Promise.all(
        invoicesList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url };
        })
      );
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploading(true);
      const storageRef = ref(storage, `invoices/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        await fetchInvoices();
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Invoices</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3">
          <h2 className="text-xl font-semibold mb-2">Upload New Invoice</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="mb-2"
            disabled={uploading}
          />
          {uploading && <p>Uploading...</p>}
          <h2 className="text-xl font-semibold mt-4 mb-2">Uploaded Invoices</h2>
          <ul className="space-y-2">
            {invoices.map((invoice, index) => (
              <li key={index}>
                <a href={invoice.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {invoice.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full md:w-2/3">
          <h2 className="text-xl font-semibold mb-2">Invoice Preview</h2>
          <p>Select an invoice to preview its contents.</p>
        </div>
      </div>
    </div>
  );
}