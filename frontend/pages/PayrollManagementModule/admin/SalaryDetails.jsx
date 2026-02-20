// frontend/pages/PayrollManagementModule/admin/SalaryDetails.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye, Edit, Search } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/Input';
import { useModal } from '../../../hooks/useModal';
import ManageSalary from './ManageSalary';
import ViewSalary from '../common/ViewSalary';
import Pagination from '../common/Pagination'; // Import the new component
import { useDebounce } from '../../../hooks/useDebounce'; // We will create this simple hook

const SalaryDetails = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const { isOpen: isManageModalOpen, openModal: openManageModal, closeModal: closeManageModal } = useModal();
    const { isOpen: isViewModalOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal();

    // --- New State for Pagination and Search ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce search input

    const fetchAllEmployees = useCallback(async (page, search) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/payroll/employees/all', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: page,
                    limit: 15, // Match the limit on the backend
                    searchTerm: search
                }
            });
            setEmployees(response.data.employees);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.currentPage);
        } catch (error) {
            console.error("Error fetching employee records:", error);
            toast.error("Failed to fetch employee records.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fetch data when the component mounts or when the debounced search term changes
        fetchAllEmployees(1, debouncedSearchTerm);
    }, [debouncedSearchTerm, fetchAllEmployees]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchAllEmployees(page, debouncedSearchTerm);
    };

    const handleManageSalary = (employee) => {
        setSelectedEmployee(employee);
        openManageModal();
    };

    const handleViewDetails = (employee) => {
        setSelectedEmployee(employee);
        openViewModal();
    };

    return (
        <>
            <PageMeta title="All Salary Details | VipraGo" />
            <PageBreadcrumb pageTitle="All Employee Salary Details" />
            <ComponentCard>
                {/* --- Title and Search Bar --- */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Employee Salary Records</h3>
                    <div className="w-full max-w-xs">
                        <Input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            startIcon={<Search size={16} />}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            {/* Table headers remain the same */}
                             <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual CTC</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-4">Loading records...</td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No employees found.</td></tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">{`${employee.first_name} ${employee.last_name}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{employee.designation || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {employee.SalaryStructure ? `₹${Number(employee.SalaryStructure.ctc).toLocaleString()}` : <span className="text-gray-400">Not Defined</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {employee.SalaryStructure ? new Date(employee.SalaryStructure.effective_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            <Button size="sm" onClick={() => handleManageSalary(employee)} startIcon={<Edit size={16} />}>
                                                {employee.SalaryStructure ? 'Update' : 'Create'}
                                            </Button>
                                            {employee.SalaryStructure && (
                                                <Button size="sm" variant="outline" onClick={() => handleViewDetails(employee)} startIcon={<Eye size={16} />}>
                                                    View
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination Controls --- */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </ComponentCard>

            {/* Modals remain the same */}
            {isManageModalOpen && selectedEmployee && (
                <ManageSalary
                    isOpen={isManageModalOpen}
                    onClose={closeManageModal}
                    employee={selectedEmployee}
                    onSuccess={() => {
                        closeManageModal();
                        fetchAllEmployees(currentPage, debouncedSearchTerm); // Refresh the current page
                    }}
                />
            )}

            {isViewModalOpen && selectedEmployee && (
                 <ViewSalary
                    isOpen={isViewModalOpen}
                    onClose={closeViewModal}
                    salaryData={selectedEmployee.SalaryStructure}
                />
            )}
        </>
    );
};

export default SalaryDetails;