import React from "react";

const ManagerTeamList = ({ teams }) => {
  if (!teams.length) return <p className="text-gray-500">You don’t manage any teams.</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">🧩 Your Teams</h2>
      <div className="overflow-x-auto rounded-xl shadow border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Team Name</th>
              <th className="p-3 text-left">Members</th>
              <th className="p-3 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{team.name}</td>
                <td className="p-3">{team.members?.length || 0}</td>
                <td className="p-3">{team.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerTeamList;

