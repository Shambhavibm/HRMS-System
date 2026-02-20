
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Pagination from '../../PayrollManagementModule/common/Pagination';
import ClaimsBarChart from './ClaimsBarChart';

const ReimbursementDashboard = ({
    fetchUrl,
    dashboardTitle,
    listTitle,
    showStatusFilter = false,
    children, // ✅ This will now be a function: (claims) => { ... }
}) => {
    const [claims, setClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [financialYears, setFinancialYears] = useState([]);
    const [selectedFY, setSelectedFY] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const claimsPerPage = 10;

    // ... All the data fetching and processing logic remains exactly the same as before ...
    const claimStatuses = ['Pending', 'Approved', 'Rejected'];

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(fetchUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            const claimsData = response.data;
            setClaims(claimsData);

            const years = new Set();
            claimsData.forEach(claim => {
                const date = new Date(claim.expense_date || claim.approved_at);
                const year = date.getFullYear();
                const month = date.getMonth();
                const fy = month >= 3 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
                years.add(fy);
            });
            const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
            setFinancialYears(sortedYears);
            if (sortedYears.length > 0) setSelectedFY(sortedYears[0]);
        } catch (error) {
            toast.error("Failed to fetch claims data.");
        } finally {
            setIsLoading(false);
        }
    }, [fetchUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const { chartData, availableMonths } = useMemo(() => {
        // ... (Chart data logic is unchanged) ...
        const categoryColors = {
            'Internet Bills': '#4C78A8', 'Mobile Bills': '#F58518', 'Client Travel': '#E45756',
            'Books/Training': '#72B7B2', 'WFH Furniture': '#54A24B', 'Team Lunch': '#EECA3B',
            'Team Outing': '#B279A2', 'Team Building': '#FF9DA7', 'Others': '#9D755D',
        };
        const categories = Object.keys(categoryColors);
        const labels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
        const datasets = categories.map(category => ({
            label: category, data: Array(12).fill(0), backgroundColor: categoryColors[category],
        }));
        const monthSet = new Map();

        if (selectedFY) {
            claims
                .filter(claim => {
                    const date = new Date(claim.expense_date || claim.approved_at);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    const claimFY = month >= 3 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
                    return claimFY === selectedFY;
                })
                .forEach(claim => {
                    const date = new Date(claim.expense_date || claim.approved_at);
                    const monthValue = date.getMonth();
                    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric'});
                    if(!monthSet.has(monthValue)) monthSet.set(monthValue, monthLabel);

                    if (claim.status === 'Approved') {
                        const datasetIndex = categories.indexOf(claim.category);
                        if (datasetIndex === -1) return;
                        let monthIndex = date.getMonth() - 3;
                        if (monthIndex < 0) monthIndex += 12;
                        datasets[datasetIndex].data[monthIndex] += parseFloat(claim.amount);
                    }
                });
        }
        const sortedMonths = Array.from(monthSet.entries()).sort((a,b) => a[0]-b[0]).map(([val, label]) => ({val, label}));
        return { chartData: { labels, datasets }, availableMonths: sortedMonths };
    }, [claims, selectedFY]);

    const filteredClaimsForList = useMemo(() => {
        return claims.filter(claim => {
            const date = new Date(claim.expense_date || claim.approved_at);
            const year = date.getFullYear();
            const month = date.getMonth();
            const claimFY = month >= 3 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
            const fyMatch = claimFY === selectedFY;
            const monthMatch = selectedMonth === 'all' || date.getMonth() === parseInt(selectedMonth);
            const statusMatch = !showStatusFilter || selectedStatus === 'all' || claim.status === selectedStatus;
            return fyMatch && monthMatch && statusMatch;
        });
    }, [claims, selectedFY, selectedMonth, selectedStatus, showStatusFilter]);

    useEffect(() => { setCurrentPage(1); }, [filteredClaimsForList]);

    const totalPages = Math.ceil(filteredClaimsForList.length / claimsPerPage);
    const paginatedClaims = filteredClaimsForList.slice((currentPage - 1) * claimsPerPage, currentPage * claimsPerPage);

    return (
        <div className="space-y-8">
            <div>
                {/* ... (Chart and FY Filter JSX is unchanged) ... */}
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{dashboardTitle}</h3>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="fy-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">Financial Year:</label>
                        <select id="fy-select" value={selectedFY} onChange={(e) => setSelectedFY(e.target.value)} className="input-style" disabled={isLoading}>
                            {financialYears.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                        </select>
                    </div>
                </div>
                {isLoading ? <div className="text-center p-8">Loading chart data...</div> : <ClaimsBarChart chartData={chartData} />}
            </div>
            <div className="mt-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 md:mb-0">{listTitle}</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* ... (Filter UI JSX is unchanged) ... */}
                        <div className="flex-1 min-w-[150px]">
                            <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                            <select id="month-filter" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="input-style w-full">
                                <option value="all">All Months</option>
                                {availableMonths.map(month => <option key={month.val} value={month.val}>{month.label}</option>)}
                            </select>
                        </div>
                        {showStatusFilter && (
                            <div className="flex-1 min-w-[150px]">
                                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select id="status-filter" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="input-style w-full">
                                    <option value="all">All Statuses</option>
                                    {claimStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* ✅ The big change: Instead of rendering the list itself, we call the children function prop,
                   passing it the data it needs to render. */}
                {isLoading ? (
                    <div className="text-center p-8">Loading...</div>
                ) : (
                    children({ claims: paginatedClaims, isLoading })
                )}
                
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        </div>
    );
};

export default ReimbursementDashboard;