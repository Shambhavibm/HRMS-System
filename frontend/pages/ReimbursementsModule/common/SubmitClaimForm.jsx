import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { LoaderIcon, UploadCloudIcon } from '../../../icons';

const SubmitClaimForm = ({ onClaimSubmitted }) => {
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        description: '',
    });
    const [expenseDate, setExpenseDate] = useState(null);
    const [receiptFile, setReceiptFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const reimbursementCategories = [
        'Internet Bills', 'Mobile Bills', 'Client Travel', 'Books/Training',
        'WFH Furniture', 'Team Lunch', 'Team Outing', 'Team Building', 'Others'
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setReceiptFile(file);
        if (file) {
            toast.success(`${file.name} selected`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category || !formData.amount || !expenseDate) {
            toast.error("Please fill all required fields.");
            return;
        }

        setIsLoading(true);
        const payload = new FormData();
        payload.append('category', formData.category);
        payload.append('amount', formData.amount);
        payload.append('expense_date', expenseDate.toISOString());
        payload.append('description', formData.description);
        if (receiptFile) {
            payload.append('receipt', receiptFile);
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/reimbursements/submit', payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
            });
            toast.success("Claim submitted successfully!");
            e.target.reset();
            setFormData({ category: '', amount: '', description: '' });
            setExpenseDate(null);
            setReceiptFile(null);
            if (onClaimSubmitted) onClaimSubmitted();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "An error occurred.";
            toast.error(`Submission failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Category */}
                    <div className="md:col-span-2">
                        <label htmlFor="category" className="">Category *</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="input-style custom-placeholder h-14 w-full px-4"
                        >
                            <option value="" disabled>Select a category...</option>
                            {reimbursementCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            onChange={handleChange}
                            required
                            className="input-style custom-placeholder h-14 w-full px-4"
                            placeholder="Enter amount"
                        />
                    </div>

                    {/* Expense Date */}
                    <div>
                        <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700 mb-2">Expense Date *</label>
                        <DatePicker
                            id="expense_date"
                            selected={expenseDate}
                            onChange={(date) => setExpenseDate(date)}
                            className="input-style custom-placeholder h-14 w-85 px-5"
                            placeholderText="Expense Date"
                            dateFormat="MMMM d, yyyy"
                            maxDate={new Date()}
                        />
                    </div>

                    {/* Notes / Justification */}
                    <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Notes / Justification</label>
                        <textarea
                            id="description"
                            name="description"
                            rows="4"
                            onChange={handleChange}
                            className="input-style custom-placeholder h-20 w-full px-5"
                            placeholder="Provide a brief description about the expense..."
                        ></textarea>
                    </div>

                    {/* Upload Receipt */}
                    <div className="md:col-span-2">
                        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">Upload Receipt</label>
                        <div className="flex items-center space-x-4">
                            <label htmlFor="file-upload" className="cursor-pointer p-3 bg-gray-100 rounded-full text-gray-500 hover:text-blue-600 transition-colors">
                                <UploadCloudIcon className="w-6 h-6" />
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={handleFileChange}
                                />
                            </label>
                            <span className="text-sm text-gray-600">
                                {receiptFile ? receiptFile.name : "No file chosen"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Submit - Text Style */}
                <div className="mt-8 flex justify-center">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="text-blue-600 text-lg font-semibold hover:underline focus:outline-none transition-all"
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <LoaderIcon className="animate-spin w-5 h-5" />
                                <span>Submitting...</span>
                            </div>
                        ) : (
                            'Submit Claim'
                        )}
                    </button>
                </div>
            </form>
        </>
    );
};

export default SubmitClaimForm;
