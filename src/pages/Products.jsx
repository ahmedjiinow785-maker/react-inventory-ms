import React, { useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiEdit2, FiMinus, FiPlus, FiPlusCircle, FiSearch, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showError, showSuccess } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';

const initialFormData = {
  productID: '',
  sku: '',
  productName: '',
  categoryID: '',
  supplierID: '',
  unitPrice: '',
  quantityInStock: '',
  reorderLevel: '',
};

const getStockStatus = (product) => {
  const low = Number(product.quantityInStock || 0) <= Number(product.reorderLevel || 0);
  return low ? 'Low Stock' : 'In Stock';
};

const Products = () => {
  const { userID } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [damagedStockModalOpen, setDamagedStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [stockForm, setStockForm] = useState({ quantity: '', remarks: '' });

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.categoryID, item.categoryName])),
    [categories],
  );

  const supplierMap = useMemo(
    () => Object.fromEntries(suppliers.map((item) => [item.supplierID, item.supplierName])),
    [suppliers],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter(
      (product) =>
        product.productName?.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query),
    );
  }, [products, search]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');

    try {
      const [productsResponse, categoriesResponse, suppliersResponse] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/categories'),
        api.get('/api/suppliers'),
      ]);

      setProducts(productsResponse.data || []);
      setCategories(categoriesResponse.data || []);
      setSuppliers(suppliersResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load products.');
      showError(err.response?.data?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setFormData(product);
    setModalOpen(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const openStockInModal = (product) => {
    setSelectedProduct(product);
    setStockForm({ quantity: '', remarks: '' });
    setStockInModalOpen(true);
  };

  const openStockOutModal = (product) => {
    setSelectedProduct(product);
    setStockForm({ quantity: '', remarks: '' });
    setStockOutModalOpen(true);
  };

  const openDamagedStockModal = (product) => {
    setSelectedProduct(product);
    setStockForm({ quantity: '', remarks: '' });
    setDamagedStockModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleStockChange = (event) => {
    const { name, value } = event.target;
    setStockForm((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.sku?.trim()) return 'SKU is required.';
    if (!formData.productName?.trim()) return 'Product name is required.';
    if (!formData.categoryID) return 'Category is required.';
    if (!formData.supplierID) return 'Supplier is required.';
    if (formData.unitPrice === '' || Number(formData.unitPrice) < 0) return 'Unit price is required.';
    if (formData.quantityInStock === '' || Number(formData.quantityInStock) < 0) return 'Quantity is required.';
    if (formData.reorderLevel === '' || Number(formData.reorderLevel) < 0) return 'Reorder level is required.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      showError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { productID, ...rest } = formData;
      const payload = {
        ...rest,
        categoryID: Number(formData.categoryID),
        supplierID: Number(formData.supplierID),
        unitPrice: Number(formData.unitPrice),
        quantityInStock: Number(formData.quantityInStock),
        reorderLevel: Number(formData.reorderLevel),
      };

      if (productID) {
        await api.put(`/api/products/${productID}`, { ...payload, productID });
        showSuccess('Product updated successfully.');
      } else {
        await api.post('/api/products', payload);
        showSuccess('Product created successfully.');
      }

      setModalOpen(false);
      setFormData(initialFormData);
      await loadProducts();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to save product.';
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      await api.delete(`/api/products/${selectedProduct.productID}`);
      showSuccess('Product deleted successfully.');
      setDeleteModalOpen(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to delete product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockIn = async (event) => {
    event.preventDefault();
    const quantity = Number(stockForm.quantity);

    if (!quantity || quantity < 1) {
      showError('Quantity must be at least 1.');
      return;
    }

    if (!userID) {
      showError('User information not available. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/stocktransactions/stockin', {
        productID: selectedProduct.productID,
        quantity,
        userID,
        remarks: stockForm.remarks || '',
      });

      showSuccess('Stock in recorded successfully.');
      setStockInModalOpen(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to record stock in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockOut = async (event) => {
    event.preventDefault();
    const quantity = Number(stockForm.quantity);
    const currentStock = Number(selectedProduct?.quantityInStock || 0);

    if (!quantity || quantity < 1) {
      showError('Quantity must be at least 1.');
      return;
    }

    if (quantity > currentStock) {
      showError(`Cannot stock out more than current stock (${currentStock}).`);
      return;
    }

    if (!userID) {
      showError('User information not available. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/stocktransactions/stockout', {
        productID: selectedProduct.productID,
        quantity,
        userID,
        remarks: stockForm.remarks || '',
      });

      showSuccess('Stock out recorded successfully.');
      setStockOutModalOpen(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to record stock out.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDamagedStock = async (event) => {
    event.preventDefault();
    const quantity = Number(stockForm.quantity);
    const currentStock = Number(selectedProduct?.quantityInStock || 0);

    if (!quantity || quantity < 1) {
      showError('Quantity must be at least 1.');
      return;
    }

    if (quantity > currentStock) {
      showError(`Cannot record more damaged stock than current stock (${currentStock}).`);
      return;
    }

    if (!userID) {
      showError('User information not available. Please log in again.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/stocktransactions/stockout', {
        productID: selectedProduct.productID,
        quantity,
        userID,
        remarks: `Damaged Stock${stockForm.remarks ? `: ${stockForm.remarks}` : ''}`,
      });

      showSuccess('Damaged stock recorded successfully.');
      setDamagedStockModalOpen(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to record damaged stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] dark:text-white">Products Management</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400">Manage full inventory data, pricing, and stock levels.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
          <FiPlusCircle />
          Add Product
        </button>
      </div>

      <div className="page-card p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by product name or SKU..."
            className="form-input pl-10"
          />
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div> : null}

      <div className="page-card overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-full border-collapse text-left text-sm">
              <thead className="text-[#64748b] dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Product Name</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Unit Price</th>
                  <th className="px-4 py-3 font-semibold">Qty in Stock</th>
                  <th className="px-4 py-3 font-semibold">Reorder Level</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center text-[#64748b] dark:text-slate-400">
                      No products available.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.productID} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold">{product.sku}</td>
                        <td className="px-4 py-3">{product.productName}</td>
                        <td className="px-4 py-3">{categoryMap[product.categoryID] || '—'}</td>
                        <td className="px-4 py-3">{supplierMap[product.supplierID] || '—'}</td>
                        <td className="px-4 py-3">${Number(product.unitPrice || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">{product.quantityInStock}</td>
                        <td className="px-4 py-3">{product.reorderLevel}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${status === 'Low Stock' ? 'badge-danger' : 'badge-success'}`}>{status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className="text-[#3b82f6]" onClick={() => openEditModal(product)} title="Edit">
                              <FiEdit2 />
                            </button>
                            <button type="button" className="text-[#ef4444]" onClick={() => openDeleteModal(product)} title="Delete">
                              <FiTrash2 />
                            </button>
                            <button type="button" className="text-[#22c55e]" onClick={() => openStockInModal(product)} title="Stock In">
                              <FiPlus />
                            </button>
                            <button type="button" className="text-[#f97316]" onClick={() => openStockOutModal(product)} title="Stock Out">
                              <FiMinus />
                            </button>
                            <button type="button" className="text-[#dc2626]" onClick={() => openDamagedStockModal(product)} title="Damaged Stock">
                              <FiAlertTriangle />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={formData.productID ? 'Edit Product' : 'Add Product'}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">SKU</span>
              <input name="sku" value={formData.sku} onChange={handleChange} className="form-input" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Product Name</span>
              <input name="productName" value={formData.productName} onChange={handleChange} className="form-input" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Category</span>
              <select name="categoryID" value={formData.categoryID} onChange={handleChange} className="form-input" required>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.categoryID} value={category.categoryID}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Supplier</span>
              <select name="supplierID" value={formData.supplierID} onChange={handleChange} className="form-input" required>
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierID} value={supplier.supplierID}>
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Unit Price</span>
              <input name="unitPrice" type="number" min="0" step="0.01" value={formData.unitPrice} onChange={handleChange} className="form-input" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Quantity in Stock</span>
              <input name="quantityInStock" type="number" min="0" value={formData.quantityInStock} onChange={handleChange} className="form-input" required />
            </label>
            <label className="space-y-2 text-sm sm:col-span-2">
              <span className="font-semibold">Reorder Level</span>
              <input name="reorderLevel" type="number" min="0" value={formData.reorderLevel} onChange={handleChange} className="form-input" required />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Product">
        <p className="mb-6 text-sm text-[#64748b] dark:text-slate-400">
          Are you sure you want to delete <strong>{selectedProduct?.productName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={submitting} className="rounded-lg bg-[#ef4444] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={stockInModalOpen} onClose={() => setStockInModalOpen(false)} title={`Stock In — ${selectedProduct?.productName || ''}`}>
        <form className="space-y-4" onSubmit={handleStockIn}>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Quantity</span>
            <input name="quantity" type="number" min="1" value={stockForm.quantity} onChange={handleStockChange} className="form-input" required />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Remarks (optional)</span>
            <textarea name="remarks" rows="3" value={stockForm.remarks} onChange={handleStockChange} className="form-input" />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setStockInModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-[#22c55e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? 'Processing...' : 'Confirm Stock In'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={stockOutModalOpen} onClose={() => setStockOutModalOpen(false)} title={`Stock Out — ${selectedProduct?.productName || ''}`}>
        <form className="space-y-4" onSubmit={handleStockOut}>
          <p className="text-sm font-semibold text-[#64748b] dark:text-slate-400">
            Current Stock: {selectedProduct?.quantityInStock ?? 0}
          </p>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Quantity</span>
            <input
              name="quantity"
              type="number"
              min="1"
              max={selectedProduct?.quantityInStock || 0}
              value={stockForm.quantity}
              onChange={handleStockChange}
              className="form-input"
              required
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Remarks (optional)</span>
            <textarea name="remarks" rows="3" value={stockForm.remarks} onChange={handleStockChange} className="form-input" />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setStockOutModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? 'Processing...' : 'Confirm Stock Out'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={damagedStockModalOpen} onClose={() => setDamagedStockModalOpen(false)} title={`Damaged Stock — ${selectedProduct?.productName || ''}`}>
        <form className="space-y-4" onSubmit={handleDamagedStock}>
          <p className="text-sm font-semibold text-[#64748b] dark:text-slate-400">
            Current Stock: {selectedProduct?.quantityInStock ?? 0}
          </p>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Damaged Quantity</span>
            <input
              name="quantity"
              type="number"
              min="1"
              max={selectedProduct?.quantityInStock || 0}
              value={stockForm.quantity}
              onChange={handleStockChange}
              className="form-input"
              required
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Remarks (optional)</span>
            <textarea name="remarks" rows="3" value={stockForm.remarks} onChange={handleStockChange} className="form-input" />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDamagedStockModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? 'Processing...' : 'Confirm Damaged Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default Products;
