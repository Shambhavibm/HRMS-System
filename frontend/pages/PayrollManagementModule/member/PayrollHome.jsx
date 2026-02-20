import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import ViewSalary from '../common/ViewSalary';
import { useAuthToken } from '../../../hooks/jwtdecode';

const MemberPayrollHome = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuthToken();

  useEffect(() => {
    const fetchMySalary = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/payroll/structure/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSalaryData(response.data);
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error('Could not load your salary information.');
        }
        // If it is 404, the ViewSalary component will show the 'not defined' message.
      } finally {
        setLoading(false);
      }
    };
    fetchMySalary();
  }, [userId]);

  return (
    <>
      <PageMeta title="My Salary Details | VipraGo" />
      <PageBreadcrumb pageTitle="My Salary" />
      <ComponentCard title="My Compensation Details">
        {loading ? (
          <div className="text-center p-8">Loading...</div>
        ) : (
          // This now works correctly because ViewSalary is a content component.
          <ViewSalary salaryData={salaryData} />
        )}
      </ComponentCard>
    </>
  );
};

export default MemberPayrollHome;