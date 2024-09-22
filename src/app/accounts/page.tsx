'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-auth';
import LogoutButton from '@/app/components/LogoutButton';
import TransactionsList from '@/app/components/TransactionsList';

interface Account {
  id: string;
  iban: string;
  institution_id: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("User authenticated, fetching accounts");
        fetchUserAccounts(user.uid);
      } else {
        console.log("No user, redirecting to login");
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserAccounts = async (userId: string) => {
    console.log("Fetching user accounts for userId:", userId);
    try {
      const response = await fetch(`/api/user-accounts?userId=${userId}`);
      const data = await response.json();

      console.log("Received accounts data:", data);

      if (response.ok) {
        setAccounts(data.accounts);
      } else {
        throw new Error(data.error || 'Failed to fetch user accounts');
      }
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountClick = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleAddAccount = () => {
    router.push('/link-bank');
  };

  console.log("Rendering AccountsPage, accounts:", accounts);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen">Error: {error}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-6">
          Your <span className="text-blue-600">Accounts</span>
        </h1>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={handleAddAccount}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Account
          </button>
          <LogoutButton />
        </div>

        {accounts.length === 0 ? (
          <p className="text-xl">No accounts found. Click "Add Account" to link a bank account.</p>
        ) : (
          <ul className="w-full max-w-2xl space-y-4">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="p-4 text-left border rounded-xl hover:border-blue-600 focus:border-blue-600 cursor-pointer transition-colors duration-200"
                onClick={() => handleAccountClick(account.id)}
              >
                <h3 className="text-xl font-semibold">Account ID: {account.id}</h3>
                <p className="mt-2">
                  <strong>IBAN:</strong> {account.iban || 'N/A'}
                </p>
                <p className="mt-1">
                  <strong>Institution ID:</strong> {account.institution_id || 'N/A'}
                </p>
              </li>
            ))}
          </ul>
        )}

        {selectedAccountId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
              <TransactionsList 
                accountId={selectedAccountId} 
                onClose={() => setSelectedAccountId(null)} 
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}