import React, { useState, useEffect } from 'react';

interface Transaction {
  transactionId: string;
  bookingDate: string;
  valueDate: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  creditorName?: string;
  creditorAccount?: {
    iban: string;
  };
  debtorName?: string;
  debtorAccount?: {
    iban: string;
  };
  remittanceInformationUnstructured: string;
}

interface TransactionsListProps {
  accountId: string;
  onClose: () => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({ accountId, onClose }) => {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/gocardless/transactions/${accountId}?_=${timestamp}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(data.message || 'Daily request limit exceeded. Please try again tomorrow.');
          }
          throw new Error(data.error || 'Failed to fetch transactions');
        }

        setTransactions(data.transactions?.booked || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [accountId]);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  return (
    <div>
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Transactions for Account {accountId}</h3>
      <div className="mb-4">
        {loading ? (
          <p>Loading transactions...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : transactions && transactions.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr 
                  key={transaction.transactionId} 
                  onClick={() => handleTransactionClick(transaction)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.bookingDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={transaction.transactionAmount.amount.startsWith('-') ? 'text-red-600' : 'text-green-600'}>
                      {transaction.transactionAmount.amount} {transaction.transactionAmount.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{transaction.remittanceInformationUnstructured}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500">No transactions found for this account.</p>
        )}
      </div>
      <div className="mt-4 text-right">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          Close
        </button>
      </div>
      {selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-5 border w-11/12 max-w-2xl max-h-[90vh] shadow-lg rounded-md bg-white flex flex-col">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Transaction Details</h3>
            <div className="flex-grow overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(selectedTransaction, null, 2)}
              </pre>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;