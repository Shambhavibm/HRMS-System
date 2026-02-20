

import React, { useEffect, useState } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import { jwtDecode } from 'jwt-decode'; 
import MemberProjectProgress from './MemberProjectProgress';

const MemberProjectProgressDashboard = () => {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null); 

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        setToken(storedToken);
        setUserId(decodedToken.userId || decodedToken.id); 
        setRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token in MemberProjectProgressDashboard:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('userId'); 
        localStorage.removeItem('role'); 
        setToken(null);
        setUserId(null);
        setRole(null);
      }
    }
  }, []); 

  return (
    <>
      <PageMeta title="VipraGo | Member Project Progress" description="View your assigned projects and submit updates" />
      {/* <PageBreadcrumb pageTitle="My Project Progress" /> */}
      <ComponentCard>
        {/* Only render MemberProjectProgress if token, userId, and role are available */}
        {token && userId && role ? (
          <MemberProjectProgress token={token} userId={userId} role={role} />
        ) : (
          <div className="p-4 text-center text-gray-600 dark:text-gray-400">
            {token ? "Loading user data..." : "Please log in to view your project progress."}
          </div>
        )}
      </ComponentCard>
    </>
  );
};

export default MemberProjectProgressDashboard;