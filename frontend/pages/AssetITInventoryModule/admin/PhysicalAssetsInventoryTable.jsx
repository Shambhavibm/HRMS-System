// frontend/pages/AssetITInventoryModule/admin/PhysicalAssetsInventoryTable.jsx

import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AssetGenericTable from '../common/AssetGenericTable';
import AssetStatusBadge from '../common/AssetStatusBadge';
import { PencilIcon, LoaderIcon, XMarkIcon, PlusIcon } from '../../../icons';

const AssetFormSlideOver = ({ isOpen, onClose, title, children }) => {
    return (
        <div className={`fixed inset-0 z-40 transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const PhysicalAssetsInventoryTable = ({ data: serializedData, refreshData, categories }) => {
    const [activeTab, setActiveTab] = useState('serialized');
    const [bulkStockData, setBulkStockData] = useState([]);
    const [isStockLoading, setIsStockLoading] = useState(true);
    const [locations, setLocations] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState('serialized');
    const [serializedFormData, setSerializedFormData] = useState({});
    const [stockFormData, setStockFormData] = useState({});
    const [currentAsset, setCurrentAsset] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const assetStatusOptions = ['Available', 'Issued', 'In Use', 'Under Repair', 'Awaiting Disposal', 'Retired', 'Lost'];
    const assetConditionOptions = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const token = localStorage.getItem('token');
                // ✅ FIX: The URL is now correct.
                const response = await axios.get('/api/assets/locations', { headers: { 'Authorization': `Bearer ${token}` } });
                setLocations(response.data);
            } catch (error) {
                toast.error("Failed to fetch office locations.");
            }
        };

        const fetchStockData = async () => {
            setIsStockLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/assets/inventory/stock', { headers: { 'Authorization': `Bearer ${token}` } });
                setBulkStockData(response.data);
            } catch (error) {
                toast.error("Failed to fetch bulk stock inventory.");
            } finally {
                setIsStockLoading(false);
            }
        };
        fetchLocations();
        fetchStockData();
    }, [refreshData]);

    const openAddForm = (type) => {
        setFormType(type);
        if (type === 'serialized') {
            setCurrentAsset(null);
            setSerializedFormData({ category_id: '', location_id: '', serial_number: '', manufacturer: '', model: '', purchase_date: '', purchase_cost: '', current_status: 'Available', condition: 'New' });
        } else {
            setStockFormData({ category_id: '', location_id: '', name: '', quantity: '' });
        }
        setIsFormOpen(true);
    };

    const openEditSerializedForm = (asset) => {
        setCurrentAsset(asset);
        setFormType('serialized');
        const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date).toISOString().split('T')[0] : '';
        const warrantyDate = asset.warranty_expiry_date ? new Date(asset.warranty_expiry_date).toISOString().split('T')[0] : '';
        setSerializedFormData({ ...asset, purchase_date: purchaseDate, warranty_expiry_date: warrantyDate, location_id: asset.location_id || '' });
        setIsFormOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (formType === 'serialized') {
            setSerializedFormData({ ...serializedFormData, [name]: value });
        } else {
            setStockFormData({ ...stockFormData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const isSerialized = formType === 'serialized';
        const url = isSerialized 
            ? (currentAsset ? `/api/assets/inventory/update/${currentAsset.asset_id}` : '/api/assets/inventory/add')
            : '/api/assets/inventory/stock/add';
        const method = isSerialized ? (currentAsset ? 'PUT' : 'POST') : 'POST';
        const data = isSerialized ? serializedFormData : stockFormData;
        const successMessage = isSerialized ? `Asset ${currentAsset ? 'updated' : 'added'} successfully!` : 'Stock added successfully!';
        const errorMessage = `Failed to ${isSerialized ? (currentAsset ? 'update' : 'add') : 'add'} ${formType}.`;

        try {
            const token = localStorage.getItem('token');
            await axios({ method, url, data, headers: { 'Authorization': `Bearer ${token}` } });
            toast.success(successMessage);
            setIsFormOpen(false);
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.message || errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const serializedColumns = [
        { header: 'Asset', cell: (asset) => (
            <>
                <div className="text-sm font-medium">{asset.manufacturer} {asset.model}</div>
                <div className="text-xs text-gray-500">{asset.category?.name} - S/N: {asset.serial_number || 'N/A'}</div>
            </>
        )},
        { header: 'Location', cell: (asset) => <div className="text-sm">{asset.location?.name || 'N/A'}</div> },
        { header: 'Status', cell: (asset) => <AssetStatusBadge status={asset.current_status} /> },
        { header: 'Actions', textAlign: 'center', cell: (asset) => (
            <button onClick={() => openEditSerializedForm(asset)} className="p-1.5 text-gray-500 hover:text-brand-600 rounded-md">
                <PencilIcon className="w-5 h-5" />
            </button>
        )}
    ];

    const bulkStockColumns = [
        { header: 'Item Name', cell: (stock) => <div className="text-sm font-semibold">{stock.name}</div> },
        { header: 'Category', cell: (stock) => <div className="text-sm">{stock.category?.name}</div> },
        { header: 'Location', cell: (stock) => <div className="text-sm">{stock.location?.name}</div> },
        { header: 'Available', cell: (stock) => <div className="text-sm font-bold text-green-600 dark:text-green-400">{stock.available_quantity}</div> },
        { header: 'Total', cell: (stock) => <div className="text-sm text-gray-500">{stock.total_quantity}</div> },
    ];

    const renderForm = () => {
        const isSerialized = formType === 'serialized';
        const isNew = isSerialized ? !currentAsset : true;

        const commonFields = (
            <>
                <div>
                    <label className="form-label">Category *</label>
                    <select name="category_id" value={isSerialized ? serializedFormData.category_id : stockFormData.category_id} onChange={handleFormChange} required className="input-field">
                        <option value="" disabled>Select category...</option>
                        {categories.filter(c => c.tracking_type === (isSerialized ? 'Serialized' : 'Bulk')).map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="form-label">Location *</label>
                    <select name="location_id" value={isSerialized ? serializedFormData.location_id : stockFormData.location_id} onChange={handleFormChange} required className="input-field">
                        <option value="" disabled>Select location...</option>
                        {locations.map(loc => <option key={loc.location_id} value={loc.location_id}>{loc.name}</option>)}
                    </select>
                </div>
            </>
        );

        return (
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="p-6 space-y-6 flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        {commonFields}
                        {isSerialized ? (
                            <>
                                <div><label className="form-label">Manufacturer *</label><input type="text" name="manufacturer" value={serializedFormData.manufacturer} onChange={handleFormChange} required className="input-field" /></div>
                                <div><label className="form-label">Model *</label><input type="text" name="model" value={serializedFormData.model} onChange={handleFormChange} required className="input-field" /></div>
                                <div><label className="form-label">Serial Number</label><input type="text" name="serial_number" value={serializedFormData.serial_number} onChange={handleFormChange} className="input-field" /></div>
                                <div><label className="form-label">Purchase Cost (₹)</label><input type="number" name="purchase_cost" value={serializedFormData.purchase_cost} onChange={handleFormChange} className="input-field" /></div>
                                <div><label className="form-label">Purchase Date</label><input type="date" name="purchase_date" value={serializedFormData.purchase_date} onChange={handleFormChange} className="input-field" /></div>
                                <div><label className="form-label">Status *</label><select name="current_status" value={serializedFormData.current_status} onChange={handleFormChange} required className="input-field">{assetStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                <div><label className="form-label">Condition *</label><select name="condition" value={serializedFormData.condition} onChange={handleFormChange} required className="input-field">{assetConditionOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            </>
                        ) : (
                            <>
                                <div><label className="form-label">Item Name *</label><input type="text" name="name" value={stockFormData.name} onChange={handleFormChange} required className="input-field" placeholder="e.g., Dell Wireless Keyboard" /></div>
                                <div><label className="form-label">Quantity to Add *</label><input type="number" name="quantity" value={stockFormData.quantity} onChange={handleFormChange} required className="input-field" placeholder="e.g., 100" /></div>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={isLoading} className="btn-primary">
                            {isLoading ? <LoaderIcon className="animate-spin w-5 h-5" /> : (isNew ? `Add ${formType === 'serialized' ? 'Asset' : 'Stock'}` : 'Save Changes')}
                        </button>
                    </div>
                </div>
            </form>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button onClick={() => setActiveTab('serialized')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'serialized' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Serialized Assets</button>
                    <button onClick={() => setActiveTab('bulk')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'bulk' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Bulk Stock</button>
                </div>
                <div className="flex space-x-2">
                     <button onClick={() => openAddForm('bulk')} className="btn-secondary-sm"><PlusIcon className="w-4 h-4 mr-1" />Add Stock</button>
                     <button onClick={() => openAddForm('serialized')} className="btn-primary-sm"><PlusIcon className="w-4 h-4 mr-1" />Add Serialized Asset</button>
                </div>
            </div>

            {activeTab === 'serialized' && ( <AssetGenericTable columns={serializedColumns} data={serializedData} noDataMessage="No serialized assets found." /> )}
            {activeTab === 'bulk' && ( isStockLoading ? <div className="p-8 text-center">Loading...</div> : <AssetGenericTable columns={bulkStockColumns} data={bulkStockData} noDataMessage="No bulk stock items found." /> )}

            <AssetFormSlideOver isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formType === 'serialized' ? (currentAsset ? 'Edit Serialized Asset' : 'Add New Serialized Asset') : 'Add New Bulk Stock'}>
                {renderForm()}
            </AssetFormSlideOver>
        </div>
    );
};

export default PhysicalAssetsInventoryTable;