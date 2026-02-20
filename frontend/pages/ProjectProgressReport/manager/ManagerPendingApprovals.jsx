
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Input from '../../../components/form/input/Input'; 
import Button from '../../../components/ui/button/Button'; 
import { toast } from 'react-toastify';

const ManagerPendingApprovals = ({ token }) => {
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [approvalSearchTerm, setApprovalSearchTerm] = useState('');

  const fetchPendingApprovals = async () => {
    try {
      const res = await axios.get('/api/updates/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUpdates(res.data);
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
    toast.error('Failed to load pending approvals');
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, [token]);

  const handleApproval = async (updateId, status) => {
    try {
      await axios.patch(`/api/updates/${updateId}/approve`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUpdates(prev => prev.filter(u => u.update_id !== updateId));
      toast.success(`Update ${status.toLowerCase()}`);
    } catch (err) {
      console.error("Failed to approve/reject update:", err);
      toast.error('Failed to approve/reject');
    }
  };

  const filteredPendingUpdates = pendingUpdates.filter(update =>
    update.project_name?.toLowerCase().includes(approvalSearchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
     <div className="mb-6 flex items-center justify-between">
  <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Pending Approvals</h2>
  <div className="w-1/3">
    <Input
      type="text"
      placeholder="Search by project name"
      className="w-full border border-black p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-white dark:text-white"
      value={approvalSearchTerm}
      onChange={(e) => setApprovalSearchTerm(e.target.value)}
    />
  </div>
</div>



      {filteredPendingUpdates.length > 0 ? (
        filteredPendingUpdates.map(update => (
          <div
            key={update.update_id}
            className="p-5 mb-4 border border-gray-300 rounded-xl shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                Project: {update.project_name || "Unknown Project"}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">Update ID: {update.update_id}</span>
            </div>

            <div className="mb-2 space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Description:</strong> {update.description}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Work Done:</strong> {update.work_done}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Progress:</strong> <span className="font-bold text-green-600">{update.progress_percent}%</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                <strong>Submitted by:</strong>{" "}
                {update.user
                  ? `${update.user.first_name} ${update.user.last_name || ''}`
                  : `User #${update.user_id}`}
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-3">
              <Button onClick={() => handleApproval(update.update_id, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white">
                Approve
              </Button>
              <Button onClick={() => handleApproval(update.update_id, 'Rejected')} className="bg-red-600 hover:bg-red-700 text-white">
                Reject
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-600 italic dark:text-gray-400">No pending approvals.</p>
      )}
    </div>
  );
};

export default ManagerPendingApprovals;