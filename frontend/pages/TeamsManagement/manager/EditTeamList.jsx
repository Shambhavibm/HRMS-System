import React, { useEffect, useState } from "react";
import axios from "axios";
import EditTeam from "../../TeamsManagement/admin/EditTeam"; // ✅ Reuse admin component

const ManagerViewTeams = () => {
  const [teams, setTeams] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [userId, setUserId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUserId(decoded.userId);
      fetchTeams(decoded.userId);
    }
  }, []);

  const fetchTeams = async (managerId) => {
    try {
      const res = await axios.get("/api/admin/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter only teams assigned to the logged-in manager
      const managerTeams = res.data.filter(
        (team) => team.manager?.user_id === managerId
      );

      setTeams(managerTeams);
    } catch (err) {
      console.error("Failed to fetch teams", err);
      alert("Error fetching teams");
    }
  };

  const handleEdit = (teamId) => {
    setEditingTeamId(teamId);
    setIsEditing(true);
  };

  const handleEditComplete = () => {
    setEditingTeamId(null);
    setIsEditing(false);
    fetchTeams(userId); // Refresh the list after editing
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {isEditing && editingTeamId ? (
        <EditTeam teamId={editingTeamId} onComplete={handleEditComplete} isManagerView={true} />

      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Your Teams</h1>
          <table className="w-full border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Team Name</th>
                <th className="p-2 text-left">Manager</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <tr key={team.id} className="border-t">
                    <td className="p-2">{team.name}</td>
                    <td className="p-2">
                      {team.manager
                        ? `${team.manager.first_name} ${team.manager.last_name}`
                        : "Not Assigned"}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleEdit(team.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500">
                    No teams assigned to you.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default ManagerViewTeams;
