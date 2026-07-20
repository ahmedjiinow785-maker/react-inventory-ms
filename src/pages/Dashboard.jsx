import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

const getStockStatus = (product) => {
  const low = Number(product.quantityInStock || 0) <= Number(product.reorderLevel || 0);
  return low ? 'Low Stock' : 'In Stock';
};

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [productsResponse, lowStockResponse] = await Promise.all([
          api.get('/api/products'),
          api.get('/api/products/lowstock'),
        ]);

        setProducts(productsResponse.data || []);
        setLowStockProducts(lowStockResponse.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + Number(product.quantityInStock || 0), 0);
  const netValue = products.reduce(
    (sum, product) => sum + Number(product.unitPrice || 0) * Number(product.quantityInStock || 0),
    0,
  );
  const recentProducts = [...products].slice(-5).reverse();

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1e293b] dark:text-white">Dashboard Analytics</h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400">Overall inventory health and asset summary</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div> : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products" value={totalProducts} tone="blue" />
        <StatCard title="Items in Stock" value={totalStock} tone="blue" />
        <StatCard
          title="Low Stock Warning"
          value={lowStockProducts.length}
          tone={lowStockProducts.length > 0 ? 'red' : 'emerald'}
          helper={lowStockProducts.length > 0 ? 'Action required' : 'All items healthy'}
        />
        <StatCard title="Net Value" value={`$${netValue.toFixed(2)}`} tone="emerald" />
      </div>

      <div className="page-card p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1e293b] dark:text-white">Recent Products</h2>
          <p className="text-sm text-[#64748b] dark:text-slate-400">The latest five products currently tracked by the system.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-full border-collapse text-left text-sm">
            <thead className="text-[#64748b] dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Product Name</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Unit Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-[#64748b] dark:text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                recentProducts.map((product, index) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.productID} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold">{product.sku}</td>
                      <td className="px-4 py-3">{product.productName}</td>
                      <td className="px-4 py-3">{product.quantityInStock}</td>
                      <td className="px-4 py-3">${Number(product.unitPrice || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${status === 'Low Stock' ? 'badge-danger' : 'badge-success'}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
