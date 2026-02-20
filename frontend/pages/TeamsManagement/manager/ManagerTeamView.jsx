
import React, { useEffect, useState } from "react";
import axios from "axios";

const ManagerTeamView = () => {
  const [teamGroups, setTeamGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const getInitials = (first, last) =>
    (first?.[0] || "") + (last?.[0] || "");

  useEffect(() => {
    const fetchTeams = async () => {
      const token = localStorage.getItem("token");
      const decoded = JSON.parse(atob(token.split(".")[1]));

      try {
        const res = await axios.get("/api/admin/teams", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const myTeams = res.data.filter(
          (team) =>
            team.manager?.user_id === decoded.userId ||
            team.manager_id === decoded.userId
        );

        const grouped = myTeams.map((team) => ({
          teamName: team.name,
          members: team.members.map((m) => ({
            ...m.user,
            role_in_team: m.role_in_team,
          })),
        }));

        setTeamGroups(grouped);
      } catch (err) {
        console.error("Failed to load team data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading team info...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">👥 My Teams Overview</h1>

      {teamGroups.length === 0 ? (
        <p className="text-center text-gray-500">
          You are not assigned to any teams yet.
        </p>
      ) : (
        teamGroups.map((group, idx) => (
          <div key={idx} className="mb-10">
            <h2 className="text-xl font-semibold text-indigo-700 mb-3">
              {group.teamName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {group.members.map((member, i) => (
                <div
                  key={i}
                  className="p-4 border rounded-lg bg-white shadow hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                      {getInitials(member.first_name, member.last_name)}
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.official_email_id}
                      </p>
                    </div>
                  </div>
                  {member.role_in_team && (
                    <p className="text-sm text-gray-600">
                      Role: {member.role_in_team}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ManagerTeamView;
