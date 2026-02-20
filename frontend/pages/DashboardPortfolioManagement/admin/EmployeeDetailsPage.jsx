// src/pages/DashboardPortfolioManagement/admin/EmployeeDetailsPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import UserMetaCard from "../../UserProfileManagement/UserMetaCard";
import UserInfoCard from "../../UserProfileManagement/UserInfoCard";
import FinancialDetailsCard from "../../UserProfileManagement/FinancialDetailsCard";
import EmployeeDetailsCard from "../../UserProfileManagement/EmployeeDetailsCard";
import EducationDetailsCard from "../../UserProfileManagement/EducationDetailsCard";
import WorkExperienceCard from "../../UserProfileManagement/WorkExperienceCard";
import EmergencyContactCard from "../../UserProfileManagement/EmergencyContactCard";

const EmployeeDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5001/api/users/profile/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEmployee(res.data);
      } catch (err) {
        console.error("Error fetching employee profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col p-6">
     {/* Back Button */}
      

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Employee Profile</h1>
      </div>


      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md w-full max-w-6xl mx-auto p-6 space-y-6">
        {/* Content */}
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-300">Loading...</div>
        ) : employee ? (
          <div className="space-y-6">
            <UserMetaCard userData={employee} refreshUserData={() => {}} />
            <UserInfoCard userData={employee} refreshUserData={() => {}} />
            <FinancialDetailsCard userData={employee} refreshUserData={() => {}} />
            <EmployeeDetailsCard userData={employee} refreshUserData={() => {}} />
            <EducationDetailsCard userData={employee} refreshUserData={() => {}} />
            <WorkExperienceCard userData={employee} refreshUserData={() => {}} />
            <EmergencyContactCard userData={employee} refreshUserData={() => {}} />
          </div>
        ) : (
          <div className="text-center text-red-500">Failed to load employee details.</div>
        )}
        <div className="mt-8 text-right">
          <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
      </div>
    </div>
  </div>

  );
};

export default EmployeeDetailsPage;
