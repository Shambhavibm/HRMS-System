
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const ManagerDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [manager, setManager] = useState(null);
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [teamMembersMap, setTeamMembersMap] = useState({});

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchManagerData = async () => {
      const token = localStorage.getItem("token");
      const decoded = JSON.parse(atob(token.split(".")[1]));

      setManager({
        name: decoded?.email,
        role: decoded?.role,
      });

      try {
        const res = await axios.get(`${apiBaseUrl}/admin/teams`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const myTeams = res.data.filter(
          (team) => team.manager?.user_id === decoded.userId
        );

        setTeams(myTeams);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };

    fetchManagerData();
  }, []);

  const handleToggle = (teamId, members) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(teamId);
      setTeamMembersMap((prev) => ({ ...prev, [teamId]: members }));
    }
  };

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">👋 Welcome, Manager</h1>
        {manager && (
          <p className="text-gray-600 mt-1">
            Logged in as: <strong>{manager.name}</strong>
          </p>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <Link
          to="/manager/my-team"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
        >
          👥 View My Team
        </Link>
        <Link
          to="/manager/leave-requests"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
        >
          📋 Review Leave Requests
        </Link>
      </div>

      {/* Teams Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">🧩 Your Teams</h2>
        {teams.length > 0 ? (
          <div className="overflow-x-auto rounded-xl shadow border">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 text-left">Team Name</th>
                  <th className="p-3 text-left">Members</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <React.Fragment key={team.id}>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="p-3">{team.name}</td>
                      <td className="p-3">{team.members?.length || 0}</td>
                      <td className="p-3">{team.description || "—"}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggle(team.id, team.members)}
                          className="text-indigo-600 hover:underline"
                        >
                          {expandedTeamId === team.id ? "Hide Members" : "🔍 View Members"}
                        </button>
                      </td>
                    </tr>

                    {expandedTeamId === team.id && (
  <tr className="bg-gray-50">
    <td colSpan={4} className="p-4">
      {team.members?.length > 0 ? (
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          {team.members.map((member) => {
            const user = member.user;
            return (
              <li key={user?.user_id}>
                {user?.first_name} {user?.last_name} ({user?.official_email_id}) —{" "}
                {user?.designation || "No designation"}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500">No members in this team.</p>
      )}
    </td>
  </tr>
)}

                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">You are not assigned to any team.</p>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;

