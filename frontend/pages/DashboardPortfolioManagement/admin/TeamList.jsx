
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TeamList = ({ teams }) => {
  const [search, setSearch] = useState("");
  const [filteredTeams, setFilteredTeams] = useState(teams);
  const [currentPage, setCurrentPage] = useState(1);
  const teamsPerPage = 5;

  useEffect(() => {
    const query = search.toLowerCase();
    const result = teams.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        (t.manager?.first_name + " " + t.manager?.last_name)
          .toLowerCase()
          .includes(query)
    );
    setFilteredTeams(result);
    setCurrentPage(1);
  }, [search, teams]);

  const indexOfLast = currentPage * teamsPerPage;
  const indexOfFirst = indexOfLast - teamsPerPage;
  const currentTeams = filteredTeams.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-10">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold text-brand-600">Teams</h2>
        <input
          type="text"
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-1 rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
            <tr>
              <th className="px-3 py-2 text-left">Team Name</th>
              <th className="px-3 py-2 text-left">Manager</th>
              <th className="px-3 py-2 text-left">Members</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTeams.map((team) => (
              <tr key={team.id || team.team_id} className="border-t">
                <td className="px-3 py-2">{team.name}</td>
                <td className="px-3 py-2">
                  {team.manager ? (
                    <span className="inline-flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                        {team.manager.first_name[0]}
                        {team.manager.last_name[0]}
                      </div>
                      {team.manager.first_name} {team.manager.last_name}
                    </span>
                  ) : (
                    <span className="italic text-gray-400">Not Assigned</span>
                  )}
                </td>
                <td className="px-3 py-2">{team.members?.length || 0}</td>
                <td className="px-3 py-2 space-x-2">
                  <Link
                    to={`/admin/teams/edit/${team.id}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/admin/teams/members/${team.id}`}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Members
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex justify-center space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded text-sm ${
              currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TeamList;
