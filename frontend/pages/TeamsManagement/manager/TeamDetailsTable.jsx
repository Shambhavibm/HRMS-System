import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const TeamDetailsTable = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/admin/teams", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const decoded = JSON.parse(atob(token.split(".")[1]));
        const myTeams = res.data.filter(
          (team) =>
            team.manager?.user_id === decoded.userId ||
            team.manager_id === decoded.userId
        );

        const selectedTeam = myTeams.find(
          (team) => Number(team.id) === Number(teamId)
        );

        if (selectedTeam) {
          setTeam(selectedTeam);
        }
      } catch (err) {
        console.error("Error fetching team:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (loading)
    return <div className="p-6 text-gray-600">Loading team details...</div>;
  if (!team)
    return (
      <div className="p-6 text-red-600">
        ❌ Team not found or you're not assigned.
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-lg">
      <h1 className="text-3xl font-semibold text-blue-800 mb-2">
        👥 {team.name}
      </h1>
      <p className="mb-6 text-gray-600 italic">{team.description}</p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border border-gray-200">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 border border-gray-200 font-semibold text-gray-700">
                👤 Name
              </th>
              <th className="px-6 py-3 border border-gray-200 font-semibold text-gray-700">
                📧 Email
              </th>
              <th className="px-6 py-3 border border-gray-200 font-semibold text-gray-700">
                🛠️ Role in Team
              </th>
            </tr>
          </thead>
          <tbody>
            {team.members.map((m, idx) => (
              <tr
                key={idx}
                className={`hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="px-6 py-3 border border-gray-200">
                  {m.user.first_name} {m.user.last_name}
                </td>
                <td className="px-6 py-3 border border-gray-200">
                  {m.user.official_email_id}
                </td>
                <td className="px-6 py-3 border border-gray-200 capitalize">
                  {m.role_in_team || "Member"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamDetailsTable;
