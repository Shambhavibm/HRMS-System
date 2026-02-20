// This form will be used by both member and manager to submit asset requests. It will fetch categories from the backend.
// AssetITInventoryModule/common/AssetRequestForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { LoaderIcon, UploadCloudIcon } from '../../../icons'; // Assuming these icons are available
import DatePicker from 'react-datepicker'; // Assuming react-datepicker is installed
import "react-datepicker/dist/react-datepicker.css";

const AssetRequestForm = ({ onRequestSubmitted }) => {
    const [formData, setFormData] = useState({
        request_type: '',
        category_id: '',
        location_id: '',
        preferred_model: '',
        justification: '',
        urgency: 'Medium',
        shipping_address: '',
    });
    const [documentFile, setDocumentFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [assetCategories, setAssetCategories] = useState([]);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
    const [locations, setLocations] = useState([]);

    const requestTypes = [
        'New Asset', 'Replacement', 'Upgrade', 'Additional', 'Repair Request', 'Onboarding'
    ];
    const urgencyOptions = ['Low', 'Medium', 'High'];

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            try {
                const [catResponse, locResponse] = await Promise.all([
                    axios.get('/api/assets/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
                    axios.get('/api/assets/locations', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                setAssetCategories(catResponse.data);
                setLocations(locResponse.data);
            } catch (error) {
                toast.error("Failed to fetch necessary data for the form.");
            } finally {
                setIsCategoriesLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setDocumentFile(file);
        if (file) {
            toast.success(`${file.name} selected for upload.`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Basic validation
        if (!formData.request_type || !formData.category_id || !formData.justification) {
            toast.error("Please fill all required fields (Request Type, Category, Justification).");
            return;
        }

        setIsLoading(true);
        const payload = new FormData();
        for (const key in formData) {
            payload.append(key, formData[key]);
        }
        if (documentFile) {
            payload.append('document', documentFile); // 'document' must match the key in upload.single('document') in backend route
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/assets/requests/submit', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
            });
            toast.success("Asset request submitted successfully!");
            // Reset form
            setFormData({
                request_type: '',
                category_id: '',
                preferred_model: '',
                justification: '',
                urgency: 'Medium',
                shipping_address: '',
            });
            setDocumentFile(null);
            e.target.reset(); // Resets file input
            if (onRequestSubmitted) onRequestSubmitted(); // Callback to parent (e.g., switch tab)
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred.";
            toast.error(`Submission failed: ${errorMessage}`);
            console.error("Asset request submission error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isCategoriesLoading) {
        return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading asset categories...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Submit New IT Asset Request</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Request Type */}
                <div>
                    <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Request Type *</label>
                    <select
                        id="request_type"
                        name="request_type"
                        value={formData.request_type}
                        onChange={handleChange}
                        required
                        className="input-style h-11 w-full px-4"
                    >
                        <option value="" disabled>Select request type...</option>
                        {requestTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>

                {/* Asset Category */}
                <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Category *</label>
                    <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        required
                        className="input-style h-11 w-full px-4"
                    >
                        <option value="" disabled>Select asset category...</option>
                        {assetCategories.map(cat => (
                            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* ✅ NEW: Location Dropdown */}
                <div className="md:col-span-2">
                    <label htmlFor="location_id" className="form-label">Request For Location *</label>
                    <select id="location_id" name="location_id" value={formData.location_id} onChange={handleChange} required className="input-style">
                        <option value="" disabled>Select the office location...</option>
                        {locations.map(loc => <option key={loc.location_id} value={loc.location_id}>{loc.name}</option>)}
                    </select>
                </div>

                {/* Preferred Model (Optional) */}
                <div>
                    <label htmlFor="preferred_model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Model (Optional)</label>
                    <input
                        type="text"
                        id="preferred_model"
                        name="preferred_model"
                        value={formData.preferred_model}
                        onChange={handleChange}
                        className="input-style h-11 w-full px-4"
                        placeholder="e.g., Dell XPS 15, Logitech MX Keys"
                    />
                </div>

                {/* Urgency */}
                <div>
                    <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urgency *</label>
                    <select
                        id="urgency"
                        name="urgency"
                        value={formData.urgency}
                        onChange={handleChange}
                        required
                        className="input-style h-11 w-full px-4"
                    >
                        {urgencyOptions.map(urg => <option key={urg} value={urg}>{urg}</option>)}
                    </select>
                </div>

                {/* Justification */}
                <div className="md:col-span-2">
                    <label htmlFor="justification" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Justification *</label>
                    <textarea
                        id="justification"
                        name="justification"
                        rows="4"
                        value={formData.justification}
                        onChange={handleChange}
                        required
                        className="input-style w-full px-4 py-2"
                        placeholder="Clearly explain why this asset is needed..."
                    ></textarea>
                </div>

                {/* Shipping Address (Optional, for onboarding/remote) */}
                <div className="md:col-span-2">
                    <label htmlFor="shipping_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shipping Address (Optional)</label>
                    <textarea
                        id="shipping_address"
                        name="shipping_address"
                        rows="3"
                        value={formData.shipping_address}
                        onChange={handleChange}
                        className="input-style w-full px-4 py-2"
                        placeholder="Enter shipping address if asset needs to be delivered remotely..."
                    ></textarea>
                </div>

                {/* Upload Document (e.g., damaged item photo for repair/replacement) */}
                <div className="md:col-span-2">
                    <label htmlFor="document-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Supporting Document (Optional)</label>
                    <div className="flex items-center space-x-4">
                        <label htmlFor="document-upload" className="cursor-pointer p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-brand-600 transition-colors">
                            <UploadCloudIcon className="w-6 h-6" />
                            <input
                                id="document-upload"
                                name="document-upload"
                                type="file"
                                className="sr-only"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={handleFileChange}
                            />
                        </label>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            {documentFile ? documentFile.name : "No file chosen (JPG, PNG, PDF)"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-center">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary"
                >
                    {isLoading ? (
                        <div className="flex items-center space-x-2">
                            <LoaderIcon className="animate-spin w-5 h-5" />
                            <span>Submitting Request...</span>
                        </div>
                    ) : (
                        'Submit Asset Request'
                    )}
                </button>
            </div>
        </form>
    );
};

export default AssetRequestForm;