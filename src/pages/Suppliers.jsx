import React, { useEffect, useState } from 'react';
import { FiEdit2, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showError, showSuccess } from '../components/Toast';
import DashboardLayout from '../layouts/DashboardLayout';

const initialFormData = {
  supplierID: '',
  supplierName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const loadSuppliers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/suppliers');
      setSuppliers(response.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load suppliers.';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openCreateModal = () => {
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setFormData(supplier);
    setModalOpen(true);
  };

  const openDeleteModal = (supplier) => {
    setSelectedSupplier(supplier);
    setDeleteModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.supplierName?.trim()) return 'Supplier name is required.';
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
      if (formData.supplierID) {
        await api.put(`/api/suppliers/${formData.supplierID}`, formData);
        showSuccess('Supplier updated successfully.');
      } else {
        const { supplierID, ...payload } = formData;
        await api.post('/api/suppliers', payload);
        showSuccess('Supplier created successfully.');
      }

      setModalOpen(false);
      setFormData(initialFormData);
      await loadSuppliers();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to save supplier.';
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;

    setSubmitting(true);
    try {
      await api.delete(`/api/suppliers/${selectedSupplier.supplierID}`);
      showSuccess('Supplier deleted successfully.');
      setDeleteModalOpen(false);
      setSelectedSupplier(null);
      await loadSuppliers();
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to delete supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] dark:text-white">Suppliers Management</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400">Manage your supplier records and contact details.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
          <FiPlusCircle />
          Add Supplier
        </button>
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
                  <th className="px-4 py-3 font-semibold">Supplier Name</th>
                  <th className="px-4 py-3 font-semibold">Contact Name</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Address</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-[#64748b] dark:text-slate-400">
                      No suppliers available.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier, index) => (
                    <tr key={supplier.supplierID} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold">{supplier.supplierName}</td>
                      <td className="px-4 py-3">{supplier.contactName || '—'}</td>
                      <td className="px-4 py-3">{supplier.phone || '—'}</td>
                      <td className="px-4 py-3">{supplier.email || '—'}</td>
                      <td className="px-4 py-3">{supplier.address || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button type="button" className="inline-flex items-center gap-1 text-[#3b82f6]" onClick={() => openEditModal(supplier)}>
                            <FiEdit2 />
                            Edit
                          </button>
                          <button type="button" className="inline-flex items-center gap-1 text-[#ef4444]" onClick={() => openDeleteModal(supplier)}>
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={formData.supplierID ? 'Edit Supplier' : 'Add Supplier'}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Supplier Name</span>
              <input name="supplierName" value={formData.supplierName} onChange={handleChange} className="form-input" required />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Contact Name</span>
              <input name="contactName" value={formData.contactName} onChange={handleChange} className="form-input" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Phone</span>
              <input name="phone" value={formData.phone} onChange={handleChange} className="form-input" />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold">Email</span>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className="form-input" />
            </label>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Address</span>
            <textarea name="address" rows="4" value={formData.address} onChange={handleChange} className="form-input" />
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Supplier">
        <p className="mb-6 text-sm text-[#64748b] dark:text-slate-400">
          Are you sure you want to delete <strong>{selectedSupplier?.supplierName}</strong>?
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
    </DashboardLayout>
  );
};

export default Suppliers;
