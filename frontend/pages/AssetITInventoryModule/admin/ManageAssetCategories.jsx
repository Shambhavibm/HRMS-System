// frontend/pages/AssetITInventoryModule/admin/ManageAssetCategories.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AssetGenericTable from '../common/AssetGenericTable';
import { PlusIcon, PencilIcon, LoaderIcon } from '../../../icons';

const ManageAssetCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category_id: null,
    name: '',
    description: '',
    tracking_type: 'Serialized', // Default to Serialized
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/assets/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      toast.error("Failed to fetch asset categories.");
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshTrigger]);

  const openAddModal = () => {
    setFormData({
      category_id: null,
      name: '',
      description: '',
      tracking_type: 'Serialized',
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (category) => {
    setFormData({
      category_id: category.category_id,
      name: category.name,
      description: category.description || '',
      tracking_type: category.tracking_type || 'Serialized', // Default if old data has no type
    });
    setIsFormModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const method = formData.category_id ? 'PUT' : 'POST';
    const url = formData.category_id
      ? `/api/assets/categories/${formData.category_id}`
      : '/api/assets/categories';

    try {
      const token = localStorage.getItem('token');
      await axios({
        method,
        url,
        data: formData,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success(`Category ${formData.category_id ? 'updated' : 'added'} successfully!`);
      setIsFormModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${formData.category_id ? 'update' : 'add'} category.`);
      console.error(`Error ${formData.category_id ? 'updating' : 'adding'} category:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { header: 'Category Name', cell: (cat) => <div className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</div> },
    { header: 'Description', cell: (cat) => <div className="text-sm text-gray-600 dark:text-gray-300 max-w-lg truncate" title={cat.description}>{cat.description || 'N/A'}</div> },
    // ✅ NEW: Display the tracking type in the table
    { 
        header: 'Tracking Type', 
        cell: (cat) => (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                cat.tracking_type === 'Serialized' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
            }`}>
                {cat.tracking_type}
            </span>
        )
    },
    {
      header: 'Actions',
      textAlign: 'center',
      cell: (cat) => (
        <button onClick={() => openEditModal(cat)} className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300">
          <PencilIcon className="w-5 h-5" />
        </button>
      ),
    },
  ];

  if (isLoading) {
    return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading categories...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Asset Categories</h2>
        <button onClick={openAddModal} className="btn-primary flex items-center space-x-2">
          <PlusIcon className="w-5 h-5" />
          <span>Add New Category</span>
        </button>
      </div>

      <AssetGenericTable columns={columns} data={categories} noDataMessage="No asset categories defined yet." />

      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-5 text-gray-800 dark:text-white">
              {formData.category_id ? 'Edit Asset Category' : 'Add New Asset Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="form-label">Category Name *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required className="input-style" />
              </div>

              {/* ✅ NEW: Form field for Tracking Type */}
              <div>
                <label htmlFor="tracking_type" className="form-label">Tracking Type *</label>
                <select id="tracking_type" name="tracking_type" value={formData.tracking_type} onChange={handleFormChange} required className="input-style">
                    <option value="Serialized">Serialized (Unique items like Laptops)</option>
                    <option value="Bulk">Bulk (Quantity-based items like Keyboards/ Mouse)</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="form-label">Description (Optional)</label>
                <textarea id="description" name="description" rows="3" value={formData.description} onChange={handleFormChange} className="input-style"></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <LoaderIcon className="animate-spin w-4 h-4" />
                      <span>{formData.category_id ? 'Updating...' : 'Adding...'}</span>
                    </div>
                  ) : (
                    formData.category_id ? 'Update Category' : 'Add Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAssetCategories;