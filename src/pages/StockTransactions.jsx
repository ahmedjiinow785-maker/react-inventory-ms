import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { showError } from '../components/Toast';
import DashboardLayout from '../layouts/DashboardLayout';

const getTransactionType = (transaction) => {
  const rawType =
    transaction.transactionType ||
    transaction.type ||
    transaction.transactionTypeName ||
    transaction.stockType ||
    '';

  const normalized = String(rawType).toLowerCase();

  if (normalized.includes('in')) return 'StockIn';
  if (normalized.includes('out')) return 'StockOut';
  return rawType || 'Unknown';
};

const getTransactionDate = (transaction) => {
  const rawDate =
    transaction.transactionDate ||
    transaction.date ||
    transaction.createdAt ||
    transaction.createdDate ||
    transaction.timestamp;

  if (!rawDate) return '—';
  return dayjs(rawDate).format('DD/MM/YYYY HH:mm');
};

const StockTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.productID, product.productName])),
    [products],
  );

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError('');

      try {
        const [transactionsResponse, productsResponse] = await Promise.all([
          api.get('/api/stocktransactions'),
          api.get('/api/products'),
        ]);

        setTransactions(transactionsResponse.data || []);
        setProducts(productsResponse.data || []);
      } catch (err) {
        const message = err.response?.data?.message || 'Unable to load stock transactions.';
        setError(message);
        showError(message);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  return (
    <DashboardLayout>
      <div className="page-card p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#1e293b] dark:text-white">Stock Transactions</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400">Track stock movement events and product changes.</p>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div> : null}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-full border-collapse text-left text-sm">
              <thead className="text-[#64748b] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-[#64748b] dark:text-slate-400">
                      No stock transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => {
                    const type = getTransactionType(transaction);
                    const isStockIn = type === 'StockIn';

                    return (
                      <tr
                        key={transaction.transactionID || `${transaction.productID}-${type}-${transaction.quantity}-${index}`}
                        className="border-t border-slate-100 dark:border-slate-700"
                      >
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold">
                          {productMap[transaction.productID] || `Product #${transaction.productID}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${isStockIn ? 'badge-success' : 'badge-danger'}`}>{type}</span>
                        </td>
                        <td className="px-4 py-3">{transaction.quantity}</td>
                        <td className="px-4 py-3">{getTransactionDate(transaction)}</td>
                        <td className="px-4 py-3">{transaction.remarks || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StockTransactions;
