import React, { useEffect, useState } from 'react';
import { FiEdit2, FiPlusCircle, FiTrash2 } from 'react-icons/fi';
import api from '../api/axios';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { showError, showSuccess } from '../components/Toast';
import DashboardLayout from '../layouts/DashboardLayout';

const initialFormData = {
  categoryID: '',
  categoryName: '',
  description: '',
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const loadCategories = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load categories.';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setFormData(category);
    setModalOpen(true);
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.categoryName?.trim()) return 'Category name is required.';
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
      if (formData.categoryID) {
        await api.put(`/api/categories/${formData.categoryID}`, formData);
        showSuccess('Category updated successfully.');
      } else {
        const { categoryID, ...payload } = formData;
        await api.post('/api/categories', payload);
        showSuccess('Category created successfully.');
      }

      setModalOpen(false);
      setFormData(initialFormData);
      await loadCategories();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to save category.';
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setSubmitting(true);
    try {
      await api.delete(`/api/categories/${selectedCategory.categoryID}`);
      showSuccess('Category deleted successfully.');
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      await loadCategories();
    } catch (err) {
      showError(err.response?.data?.message || 'Unable to delete category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] dark:text-white">Categories Management</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400">Organize products into meaningful categories.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2">
          <FiPlusCircle />
          Add Category
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
                  <th className="px-4 py-3 font-semibold">Category Name</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-[#64748b] dark:text-slate-400">
                      No categories available.
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr key={category.categoryID} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-4 py-3">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold">{category.categoryName}</td>
                      <td className="px-4 py-3">{category.description || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button type="button" className="inline-flex items-center gap-1 text-[#3b82f6]" onClick={() => openEditModal(category)}>
                            <FiEdit2 />
                            Edit
                          </button>
                          <button type="button" className="inline-flex items-center gap-1 text-[#ef4444]" onClick={() => openDeleteModal(category)}>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={formData.categoryID ? 'Edit Category' : 'Add Category'}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Category Name</span>
            <input name="categoryName" value={formData.categoryName} onChange={handleChange} className="form-input" required />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Description (optional)</span>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="form-input" />
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Category">
        <p className="mb-6 text-sm text-[#64748b] dark:text-slate-400">
          Are you sure you want to delete <strong>{selectedCategory?.categoryName}</strong>?
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

export default Categories;
