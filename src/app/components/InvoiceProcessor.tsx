import { useState } from 'react';

interface InvoiceData {
  amountNetto: string;
  vat: string;
  amountBrutto: string;
  numerFaktury: string;
  dataWystawienia: string;
  dataSprzedazy: string;
  terminPlatnosci: string;
  sposobZaplaty: string;
  sprzedawca: {
    nazwa: string;
    adres: string;
    nip: string;
  };
  nabywca: {
    nazwa: string;
    adres: string;
    nip: string;
  };
  pozycjeFaktury: Array<{
    nazwa: string;
    ilosc: number;
    jednostka: string;
    cenaJednostkowa: number;
    wartoscNetto: number;
    stawkaVAT: string;
  }>;
  podsumowanie: {
    wartoscNetto: number;
    kwotaVAT: number;
    wartoscBrutto: number;
  };
  zaplacono: number;
  pozostaloDoZaplaty: number;
  numerKontaBankowego: string;
  uwagi: string;
}

export default function InvoiceProcessor() {
  const [result, setResult] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<string>('');

  const processInvoice = async () => {
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

      const data: InvoiceData = JSON.parse(rawData);
      setResult(data);
      setError(null);
    } catch (err) {
      console.error('Error processing invoice:', err);
      setError('Failed to process invoice. Please try again.');
      setResult(null);
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
          <p className="ml-2">{JSON.stringify(value)}</p>
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
              : JSON.stringify(item)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <textarea
        value={invoiceData}
        onChange={(e) => setInvoiceData(e.target.value)}
        placeholder="Paste your invoice data here"
        rows={10}
        className="w-full p-2 border rounded"
      />
      <button 
        onClick={processInvoice}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Process Invoice
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {rawResponse && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Raw API Response:</h2>
          <pre className="bg-gray-100 p-4 mt-2 rounded overflow-auto">{rawResponse}</pre>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Extracted Invoice Data:</h2>
          {renderNestedObject(result)}
        </div>
      )}
    </div>
  );
}