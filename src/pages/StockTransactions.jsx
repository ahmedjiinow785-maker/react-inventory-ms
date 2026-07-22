import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { FiRotateCcw } from 'react-icons/fi';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { showError, showSuccess } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
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

const isDamagedTransaction = (transaction) =>
  getTransactionType(transaction).toLowerCase().includes('damage') || transaction.remarks?.toLowerCase().includes('damaged stock');

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

const StockTransactions = ({ damagedOnly = false }) => {
  const { userID } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoreItem, setRestoreItem] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const productMap = useMemo(
    () => Object.fromEntries(products.map((product) => [product.productID, product.productName])),
    [products],
  );

  const visibleTransactions = useMemo(
    () => (damagedOnly ? transactions.filter(isDamagedTransaction) : transactions),
    [damagedOnly, transactions],
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

  const handleRestore = async () => {
    if (!restoreItem) return;

    const id = restoreItem.transactionID || restoreItem.id;
    const productId = restoreItem.productID || restoreItem.productId;
    const quantity = Number(restoreItem.quantity);

    if (!userID) {
      showError('User information not available. Please log in again.');
      return;
    }

    setRestoring(true);

    try {
      try {
        await api.post('/api/damaged-stock/restore', { id, productId, quantity });
      } catch (err) {
        if (![404, 405].includes(err.response?.status)) throw err;

        await api.post('/api/stocktransactions/stockin', {
          productID: productId,
          quantity,
          userID,
          remarks: `Restored damaged stock${restoreItem.remarks ? `: ${restoreItem.remarks}` : ''}`,
        });
      }

      setTransactions((current) => current.filter((transaction) => transaction !== restoreItem));
      setRestoreItem(null);
      showSuccess('Stock restored successfully.');
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to restore damaged stock.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-card p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#1e293b] dark:text-white">{damagedOnly ? 'Damaged Stock' : 'Stock Transactions'}</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400">
            {damagedOnly ? 'Review products removed from inventory because they were damaged.' : 'Track stock movement events and product changes.'}
          </p>
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
                  {damagedOnly ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={damagedOnly ? 7 : 6} className="px-4 py-8 text-center text-[#64748b] dark:text-slate-400">
                      {damagedOnly ? 'No damaged stock records found.' : 'No stock transactions found.'}
                    </td>
                  </tr>
                ) : (
                  visibleTransactions.map((transaction, index) => {
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
                        {damagedOnly ? (
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setRestoreItem(transaction)}
                              className="inline-flex items-center gap-2 rounded-lg bg-[#22c55e] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#16a34a]"
                              title="Restore / Re-use stock"
                            >
                              <FiRotateCcw aria-hidden="true" />
                              Restore / Re-use
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(restoreItem)}
        onClose={() => (restoring ? null : setRestoreItem(null))}
        title="Confirm Stock Restore"
      >
        <p className="mb-6 text-sm text-[#64748b] dark:text-slate-400">
          Restore <strong>{restoreItem?.quantity || 0}</strong> unit(s) of{' '}
          <strong>{productMap[restoreItem?.productID || restoreItem?.productId] || 'this product'}</strong> to active inventory?
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setRestoreItem(null)}
            disabled={restoring}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={restoring}
            className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {restoring ? 'Restoring...' : 'Confirm Restore'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default StockTransactions;
