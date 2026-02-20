
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ComponentCard from '../../../components/common/ComponentCard';

const EditTeamList = () => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/teams", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(res.data || []);
    };

    fetchTeams();
  }, []);

  return (
    <ComponentCard>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Edit a Team</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <thead className="bg-gray-100 dark:bg-gray-700 text-sm">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Team Name</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Manager</th>
              <th className="px-6 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {teams.map(team => (
              <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">{team.name}</td>
                <td className="px-6 py-4">
                  {team.manager
                    ? `${team.manager.first_name} ${team.manager.last_name}`
                    : "Not Assigned"}
                </td>
                <td className="px-6 py-4">
                  <Link
                    to={`/admin/teams/edit/${team.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ComponentCard>
  );
};

export default EditTeamList;
