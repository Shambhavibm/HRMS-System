

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Input from '../../../components/form/input/Input';
import Button from '../../../components/ui/button/Button';
import ComponentCard from '../../../components/common/ComponentCard';
import Pagination from "../../PayrollManagementModule/common/Pagination";
import { useDebounce } from '../../../hooks/useDebounce';
import { Search } from 'lucide-react';

const AssignMembers = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination + Search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchUsers = useCallback(async (page, search) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 10,
          searchTerm: search
        }
      });

      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/admin/teams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeams(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch teams.");
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchUsers(1, debouncedSearch);
  }, [debouncedSearch, fetchUsers]);

  const handleAssign = async (userId) => {
    if (!selectedTeam) {
      toast.warning("Please select a team first.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/teams/${selectedTeam}/members`, {
        member_ids: [userId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Member assigned successfully!");
      fetchUsers(currentPage, debouncedSearch); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Assignment failed.");
    }
  };

  return (
    <ComponentCard>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Assign Members to a Team</h2>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="w-full sm:w-64">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startIcon={<Search size={16} />}
          />
        </div>
        <select
          className="border rounded px-3 py-2 w-full sm:w-64 dark:bg-gray-800 dark:text-white"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">Select a team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan="3" className="text-center py-4">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="3" className="text-center py-4 text-gray-500">No users found.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">{user.first_name} {user.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.official_email_id}</td>
                  <td className="px-6 py-4 text-center">
                    <Button size="sm" onClick={() => handleAssign(user.user_id)}>Assign</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchUsers(page, debouncedSearch)}
      />
    </ComponentCard>
  );
};

export default AssignMembers;
