import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Eye } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/Input';
import { useModal } from '../../../hooks/useModal';
import { Modal } from '../../../components/ui/modal';
import ViewSalary from '../common/ViewSalary';
import { useAuthToken } from '../../../hooks/jwtdecode';

const ManagerPayrollHome = () => {
  const [mySalaryData, setMySalaryData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingMySalary, setLoadingMySalary] = useState(true);
  const [selectedSalary, setSelectedSalary] = useState(null);
  const { isOpen, openModal, closeModal } = useModal();
  const { userId } = useAuthToken();

  useEffect(() => {
    if (!userId) return;

    const fetchMySalary = async () => {
      setLoadingMySalary(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/payroll/structure/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMySalaryData(response.data);
      } catch (error) {
        if (error.response?.status !== 404) toast.error("Could not load your salary.");
      } finally {
        setLoadingMySalary(false);
      }
    };

    const fetchTeamMembers = async () => {
      setLoadingTeam(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/my-team', { 
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeamMembers(response.data);
      } catch (error) {
        toast.error('Could not fetch team members.');
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchMySalary();
    fetchTeamMembers();
  }, [userId]);

  const handleViewSalary = async (employeeId) => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/payroll/structure/${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedSalary(res.data);
        openModal();
    } catch (error) {
        if (error.response?.status === 404){
            toast.info("No salary structure has been defined for this user yet.");
        } else {
            toast.error("Failed to fetch salary details.");
        }
    }
  };

  const filteredMembers = useMemo(() => 
    teamMembers.filter(member => 
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.official_email_id.toLowerCase().includes(searchTerm.toLowerCase())
    ), [teamMembers, searchTerm]);

  return (
    <>
      <PageMeta title="Team Payroll | VipraGo" />
      <PageBreadcrumb pageTitle="Payroll Overview" />

      <div className="mb-8">
        <ComponentCard title="My Compensation Details">
            {loadingMySalary ? (
                <div className="text-center p-8">Loading your salary details...</div>
            ) : (
                <ViewSalary salaryData={mySalaryData} />
            )}
        </ComponentCard>
      </div>

      <ComponentCard title="My Team Members">
         <div className="flex items-center gap-4 mb-6">
            <Input
              type="text"
              placeholder="Search your team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {loadingTeam ? (
                        <tr><td colSpan="4" className="text-center py-4">Loading team...</td></tr>
                    ) : filteredMembers.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-4 text-gray-500">No team members found.</td></tr>
                    ) : (
                        filteredMembers.map(member => (
                            <tr key={member.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 whitespace-nowrap">{`${member.first_name} ${member.last_name}`}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{member.official_email_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{member.designation || 'N/A'}</td>
                                <td className="px-6 py-4 text-center">
                                    <Button size="sm" onClick={() => handleViewSalary(member.user_id)} startIcon={<Eye size={16} />}>
                                        View Salary
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </ComponentCard>
       
       {/* This modal now correctly wraps the ViewSalary component */}
       <Modal isOpen={isOpen} onClose={closeModal} title="View Team Member Salary" className="max-w-4xl m-4">
            <ViewSalary salaryData={selectedSalary} />
       </Modal>
    </>
  );
};

export default ManagerPayrollHome;