
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import EmployeeList from "./EmployeeList";
import TeamList from "./TeamList";


export default function Home() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }

      try {
        const [userRes, teamRes] = await Promise.all([
          axios.get(`${apiBaseUrl}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiBaseUrl}/admin/teams`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setUsers(userRes.data.users || []);
        setTeams(teamRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        if (
          err.response &&
          (err.response.status === 401 || err.response.status === 403)
        ) {
          setError(
            err.response.data?.message || "Access denied. Please log in again."
          );
          localStorage.removeItem("token");
          navigate("/signin");
        } else {
          setError("Failed to load dashboard data.");
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl, navigate]);

  if (loading) {
    return <div className="p-4 text-center">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center">{error}</div>;
  }

  const role =
    localStorage.getItem("token") &&
    JSON.parse(window.atob(localStorage.getItem("token").split(".")[1])).role;

  return (
  <div className="p-6 space-y-12">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👋 Welcome, Admin!</h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        Manage your organization’s teams and members from one place.
      </p>
    </div>

    {/* 🧑‍💼 Organization Users */}
<EmployeeList users={users} role={role} />


    {/* 🧩 Teams Overview */}
    <TeamList teams={teams} />
  </div>
);

}
