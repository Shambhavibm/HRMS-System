
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import EmployeeDetailsModal from "../../../components/admin/EmployeeDetailsModal";

const EmployeeList = ({ users = [] }) => {
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(Array.isArray(users) ? users : []);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const usersPerPage = 10;

  const handleViewDetails = (user) => {
    navigate(`/employee-details/${user.user_id}`);
  };

  useEffect(() => {
    const safeUsers = Array.isArray(users) ? users : [];
    const query = search.toLowerCase();

    const result = safeUsers.filter(
      (u) =>
        u.first_name.toLowerCase().includes(query) ||
        u.last_name.toLowerCase().includes(query) ||
        u.official_email_id.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
    );
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [search, users]);

  const safeFilteredUsers = Array.isArray(filteredUsers) ? filteredUsers : [];

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = safeFilteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(safeFilteredUsers.length / usersPerPage);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Employees</h2>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mt-4 md:mt-0">
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <Link
            to="/invite-employee"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition"
          >
            ➕ Invite Employee
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead className="text-left text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.user_id} className="bg-white dark:bg-gray-800 shadow rounded">
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold uppercase">
                      {user.first_name[0]}
                      {user.last_name[0]}
                    </div>
                    <div>
                      <div>{user.first_name} {user.last_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.official_email_id}</td>
                <td className="px-4 py-3 uppercase">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleViewDetails(user)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-5 flex justify-center space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 text-sm rounded ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Profile Modal */}
      
    </div>
  );
};

export default EmployeeList;
