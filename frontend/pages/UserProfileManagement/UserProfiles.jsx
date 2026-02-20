
//to ftech data from backend
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthToken } from "../../hooks/jwtdecode";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import UserMetaCard from "./UserMetaCard";
import UserInfoCard from "./UserInfoCard";
import FinancialDetailsCard from "./FinancialDetailsCard";
import EmployeeDetailsCard from "./EmployeeDetailsCard";
import EducationDetailsCard from "./EducationDetailsCard";
import WorkExperienceCard from "./WorkExperienceCard";
import EmergencyContactCard from "./EmergencyContactCard";
import PageMeta from "../../components/common/PageMeta";


export default function UserProfiles() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId: currentUserId, token } = useAuthToken(); // Destructure userId and token

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUserId || !token) {
        setLoading(false); 
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5001/api/users/profile/${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("User data:", response.data);
        setUserData(response.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err); // Set error state
      } finally {
        setLoading(false); // Always set loading to false
      }
    };

    fetchUserData();
  }, [currentUserId, token]);

  // Function to refresh user data after an update in child components
  const refreshUserData = async () => {
    if (!token || !currentUserId) {
      console.error("Cannot refresh data: token or userId missing.");
      return;
    }
    try {
      const response = await axios.get(`http://localhost:5001/api/users/profile/${currentUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserData(response.data);
      console.log("User data refreshed:", response.data);
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
  };

  if (loading) {
    return <div className="p-5 text-center">Loading user profile...</div>;
  }

  if (error) {
    return <div className="p-5 text-center text-red-500">Error loading profile: {error.message}</div>;
  }

  if (!userData) { // If not loading, but no data (e.g., after an error)
    return <div className="p-5 text-center">No user profile data available.</div>;
  }
  
  return (
    <>
      <PageMeta
        title="VipraGo | Next-Gen Talent & Workflow Orchestrator by Vipra Software Private Limited"
        description="Streamline. Simplify. Scale. – That’s VipraGo. Developed by Vipra Software Private Limited, VipraGo is a next-gen, AI-ready HRMS and workforce automation platform built with React.js and Tailwind CSS. Designed to streamline employee lifecycle, simplify payroll, leave, and attendance, and scale effortlessly across startups and enterprises."
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard  userData={userData} refreshUserData={refreshUserData} />
          <UserInfoCard userData={userData} refreshUserData={refreshUserData} />
          <FinancialDetailsCard  userData={userData} refreshUserData={refreshUserData}/>
          <EmployeeDetailsCard  userData={userData} refreshUserData={refreshUserData}/>
          <EducationDetailsCard userData={userData} refreshUserData={refreshUserData}/>
          <WorkExperienceCard userData={userData}  efreshUserData={refreshUserData}/>
          <EmergencyContactCard userData={userData} refreshUserData={refreshUserData} />
        </div>
      </div>
    </>
  );
}