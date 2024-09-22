'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import TransactionsList from '@/app/components/TransactionsList';
import LogoutButton from '@/app/components/LogoutButton';

interface Account {
  id: string;
  iban: string;
  institution_id: string;
  status: string;
  owner_name: string;
  created: string;
  last_accessed: string | null;
  balances?: {
    amount: number;
    currency: string;
  }[];
}

interface RequisitionData {
  id: string;
  status: string;
  accounts: Account[];
}

export default function AccountsPage() {
  const { id } = useParams();
  const [requisitionData, setRequisitionData] = useState<RequisitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;

      try {
        const response = await fetch(`/api/gocardless/accounts?requisition_id=${id}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch accounts');
        }
        
        setRequisitionData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [id]);

  const handleAccountClick = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Accounts for Requisition {id}</h1>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading && <p className="text-center text-gray-500">Loading...</p>}
          {error && <p className="text-center text-red-500">Error: {error}</p>}
          {!loading && !error && requisitionData && (
            <>
              <p className="mb-4 text-lg font-medium text-gray-700">Status: {requisitionData.status}</p>
              {requisitionData.accounts.length === 0 ? (
                <p className="text-center text-gray-500">No accounts found for this requisition. The bank connection may not be complete or no accounts are available.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {requisitionData.accounts.map((account) => (
                    <div
                      key={account.id}
                      className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-300 ease-in-out"
                      onClick={() => handleAccountClick(account.id)}
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Account: {account.iban}</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Institution ID: {account.institution_id}</p>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Status: {account.status}</p>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Owner: {account.owner_name || 'N/A'}</p>
                        {account.balances && account.balances.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900">Balances:</h4>
                            <ul className="mt-2 space-y-1">
                              {account.balances.map((balance, index) => (
                                <li key={index} className="text-sm text-gray-500">
                                  {balance.amount} {balance.currency}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedAccountId && (
        <TransactionsList 
          accountId={selectedAccountId} 
          onClose={() => setSelectedAccountId(null)} 
        />
      )}
    </div>
  );
}
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import TransactionsList from '@/app/components/TransactionsList';
import LogoutButton from '@/app/components/LogoutButton';

interface Account {
  id: string;
  iban: string;
  institution_id: string;
  status: string;
  owner_name: string;
  created: string;
  last_accessed: string | null;
  balances?: {
    amount: number;
    currency: string;
  }[];
}

interface RequisitionData {
  id: string;
  status: string;
  accounts: Account[];
}

export default function AccountsPage() {
  const { id } = useParams();
  const [requisitionData, setRequisitionData] = useState<RequisitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;

      try {
        const response = await fetch(`/api/gocardless/accounts?requisition_id=${id}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch accounts');
        }
        
        setRequisitionData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [id]);

  const handleAccountClick = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!requisitionData) return <div>No data found</div>;

  return (
    <div className="container mx-auto p-4 relative">
      <LogoutButton />
      <h1 className="text-2xl font-bold mb-4">Accounts for Requisition {id}</h1>
      <p>Status: {requisitionData.status}</p>
      {requisitionData.accounts.length === 0 ? (
        <p>No accounts found for this requisition. The bank connection may not be complete or no accounts are available.</p>
      ) : (
        <ul>
          {requisitionData.accounts.map((account) => (
            <li key={account.id} className="mb-4 p-4 border rounded cursor-pointer hover:bg-gray-100" onClick={() => handleAccountClick(account.id)}>
              <p><strong>ID:</strong> {account.id}</p>
              <p><strong>IBAN:</strong> {account.iban}</p>
              <p><strong>Institution ID:</strong> {account.institution_id}</p>
              <p><strong>Status:</strong> {account.status}</p>
              <p><strong>Owner Name:</strong> {account.owner_name || 'N/A'}</p>
              <p><strong>Created:</strong> {new Date(account.created).toLocaleString()}</p>
              <p><strong>Last Accessed:</strong> {account.last_accessed ? new Date(account.last_accessed).toLocaleString() : 'N/A'}</p>
              {account.balances && account.balances.length > 0 && (
                <div>
                  <strong>Balances:</strong>
                  <ul>
                    {account.balances.map((balance, index) => (
                      <li key={index}>
                        {balance.amount} {balance.currency}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {selectedAccountId && (
        <TransactionsList 
          accountId={selectedAccountId} 
          onClose={() => setSelectedAccountId(null)} 
        />
      )}
    </div>
  );
}