
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/Input';
import { useModal } from '../../../hooks/useModal';
import ManageSalary from './ManageSalary';

const PayrollHome = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.info('Please enter a name or email to search.');
      return;
    }
    setLoading(true);
    setEmployees([]);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/payroll/search-employees', {
        headers: { Authorization: `Bearer ${token}` },
        params: { searchTerm },
      });
      setEmployees(response.data);
      if (response.data.length === 0) {
        toast.info('No employees found matching your search.');
      }
    } catch (error) {
      console.error('Error searching employees:', error);
      toast.error(error.response?.data?.message || 'Failed to search for employees.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSalaryClick = (employee) => {
    setSelectedEmployee(employee);
    openModal();
  };

  return (
    <>
      <PageMeta title="Payroll Management | VipraGo" />
      <PageBreadcrumb pageTitle="Payroll Home" />

      <ComponentCard title="Employee Payroll Search">
        <form onSubmit={handleSearch} className="flex items-center gap-4 mb-6">
          <Input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button type="submit" disabled={loading} startIcon={<Search size={18} />}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTC</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {employees.map((employee) => (
                <tr key={employee.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">{`${employee.first_name} ${employee.last_name}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.official_email_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.designation || 'N/A'}</td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     {employee.SalaryStructure ? `₹${Number(employee.SalaryStructure.ctc).toLocaleString()}` : <span className="text-gray-400">Not Defined</span>}
                   </td>
                  <td className="px-6 py-4 text-center">
                    <Button size="sm" onClick={() => handleManageSalaryClick(employee)}>
                      {employee.SalaryStructure ? 'Update Salary' : 'Create Salary'}
                    </Button>
                  </td>
                </tr>
              ))}
               {loading && (
                <tr>
                    <td colSpan="5" className="text-center py-4">Searching...</td>
                </tr>
                )}
                {!loading && employees.length === 0 && searchTerm && (
                <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">No results found.</td>
                </tr>
                )}
            </tbody>
          </table>
        </div>
      </ComponentCard>

      {isOpen && selectedEmployee && (
        <ManageSalary
            isOpen={isOpen}
            onClose={closeModal}
            employee={selectedEmployee}
            onSuccess={() => {
                closeModal();
                // Refresh search results to show updated CTC
                if(searchTerm) {
                    const fakeEvent = { preventDefault: () => {} };
                    handleSearch(fakeEvent);
                }
            }}
        />
      )}
    </>
  );
};

export default PayrollHome;