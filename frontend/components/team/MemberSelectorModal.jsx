// frontend/components/team/MemberSelectorModal.jsx
import React, { useState, useEffect } from "react";        
import axios from "axios";
import Button from "../ui/button/Button";
import Input from "../form/input/Input";
import ReactDOM from 'react-dom';
import Pagination from '../../pages/PayrollManagementModule/common/Pagination';
import { Search } from "lucide-react";


const MemberSelectorModal = ({ isOpen, onClose, onConfirm, preSelected = [] }) => {
  const [users, setUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState(preSelected);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!isOpen) return;
    fetchUsers(currentPage, searchTerm);
  }, [isOpen, currentPage, searchTerm]);

  const fetchUsers = async (page, search) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 10, searchTerm: search },
      });
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectAllCurrentPage = () => {
    const currentPageIds = users.map((u) => u.user_id);
    const allSelected = currentPageIds.every((id) => selectedMembers.includes(id));

    if (allSelected) {
      // Remove current page ids
      setSelectedMembers((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      // Add current page ids
      setSelectedMembers((prev) => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-20 bg-white/30 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-auto p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Select Members
        </h3>

        <div className="mb-4 flex items-center gap-4">
          <Input
            placeholder="Search members by name or email"
            value={searchTerm}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchTerm(e.target.value);
            }}
            startIcon={<Search size={16} />}
          />
          <Button variant="outline" size="sm" onClick={selectAllCurrentPage}>
            {users.length > 0 &&
            users.every((u) => selectedMembers.includes(u.user_id))
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="p-2 w-10">
                {/* Checkbox for select all current page handled by button above */}
              </th>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.user_id}
                  className="border-t hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => toggleSelect(user.user_id)}
                >
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user.user_id)}
                      onChange={() => toggleSelect(user.user_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="p-2">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="p-2">{user.official_email_id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(selectedMembers)}>Confirm Selection</Button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default MemberSelectorModal;
