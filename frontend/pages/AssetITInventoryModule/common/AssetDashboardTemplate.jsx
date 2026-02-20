// frontend/pages/AssetITInventoryModule/common/AssetDashboardTemplate.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Pagination from '../../PayrollManagementModule/common/Pagination';
import { LoaderIcon } from '../../../icons';

const AssetDashboardTemplate = ({
    fetchUrl,
    listTitle,
    showStatusFilter = false,
    showCategoryFilter = false,
    children,
}) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [assetCategories, setAssetCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const allPossibleStatuses = [
        'Pending Manager Approval', 'Pending Secondary Approval', 'Pending Admin Approval', 'Approved',
        'Rejected', 'Assigned for Fulfillment', 'Awaiting Procurement', 'Fulfilled', 'Cancelled',
        'Available', 'Issued', 'In Use', 'Under Repair', 'Awaiting Disposal', 'Retired', 'Lost'
    ];

    // ✅ FIX: Define fetchData with useCallback to create a stable function reference.
    // This function can now be safely used in useEffect and passed as a prop.
    const fetchData = useCallback(async (cancelToken) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(fetchUrl, {
                headers: { 'Authorization': `Bearer ${token}` },
                cancelToken: cancelToken,
            });
            setData(response.data);
        } catch (error) {
            if (!axios.isCancel(error)) {
                console.error("Fetch data error:", error);
                toast.error(`Failed to fetch ${listTitle || 'data'}.`);
            }
        } finally {
            setIsLoading(false);
        }
    }, [fetchUrl, listTitle]); // It depends on fetchUrl, so it will be recreated only if that prop changes.

    const fetchCategories = useCallback(async (cancelToken) => {
        if (!showCategoryFilter) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/assets/categories', {
                headers: { 'Authorization': `Bearer ${token}` },
                cancelToken: cancelToken,
            });
            setAssetCategories(response.data);
        } catch (error) {
            if (!axios.isCancel(error)) {
                console.error("Error fetching categories for filter:", error);
            }
        }
    }, [showCategoryFilter]);

    // ✅ FIX: The useEffect hook now safely calls the memoized functions.
    useEffect(() => {
        const source = axios.CancelToken.source();
        fetchData(source.token);
        fetchCategories(source.token);

        // Cleanup function to cancel requests if the component unmounts
        return () => {
            source.cancel("Component unmounted and request was cancelled.");
        };
    }, [fetchData, fetchCategories]); // This dependency array is now stable.

    const filteredData = useMemo(() => {
        if (!data) return [];
        return data.filter(item => {
            const categoryMatch = !showCategoryFilter || selectedCategory === 'all' || (item.category && item.category.category_id === parseInt(selectedCategory));
            const statusMatch = !showStatusFilter || selectedStatus === 'all' || item.current_status === selectedStatus;
            return categoryMatch && statusMatch;
        });
    }, [data, selectedCategory, selectedStatus, showCategoryFilter, showStatusFilter]);

    useEffect(() => { setCurrentPage(1); }, [selectedCategory, selectedStatus]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-4">
            <div className="mt-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{listTitle}</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {showCategoryFilter && (
                            <div className="flex-1 min-w-[150px]">
                                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input-style w-full" disabled={isLoading}>
                                    <option value="all">All Categories</option>
                                    {assetCategories.map(cat => <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>)}
                                </select>
                            </div>
                        )}
                        {showStatusFilter && (
                            <div className="flex-1 min-w-[150px]">
                                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="input-style w-full" disabled={isLoading}>
                                    <option value="all">All Statuses</option>
                                    {allPossibleStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-16"><LoaderIcon className="w-8 h-8 animate-spin text-brand-600" /></div>
                    ) : (
                        // ✅ FIX: Now `fetchData` is correctly defined in this scope to be passed as `refreshData`
                        typeof children === "function" ? children({ data: paginatedData, isLoading, refreshData: fetchData }) : children
                    )}
                </div>

                {!isLoading && totalPages > 1 && (
                    <div className="pt-4">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetDashboardTemplate;