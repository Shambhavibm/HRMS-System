
import React, { useState, useEffect, useMemo } from 'react';

const ManagerApprovalHistory = () => {
  const [token, setToken] = useState(null); 
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    console.log("ManagerApprovalHistory: Token received from localStorage:", savedToken);
    if (savedToken) {
      setToken(savedToken);
    } else {
      console.warn("ManagerApprovalHistory: No token found in localStorage.");
    }
  }, []);

  const fetchApprovalHistory = async (authToken) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/api/updates/history', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  },
});


      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch approval history');
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchApprovalHistory(token);
    }
  }, [token]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    const lower = searchTerm.toLowerCase();
    return history.filter(item =>
      item.project_name?.toLowerCase().includes(lower) ||
      item.submitted_by?.toLowerCase().includes(lower) ||
      item.description?.toLowerCase().includes(lower) ||
      item.approval_status?.toLowerCase().includes(lower)
    );
  }, [history, searchTerm]);

  return (
    <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
      <div className="mb-2 flex items-center justify-between">
  <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Approval History</h2>
  <div className="w-100">
    <input
      type="text"
      placeholder="Search by Project, Employee, Description, or Status"
      className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-white"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>

      {loading && (
        <p className="text-center text-blue-500 dark:text-blue-400">Loading approval history...</p>
      )}

      {error && (
        <div className="text-center text-red-500 dark:text-red-400">
          <p>Error: {error}</p>
          <button
            onClick={fetchApprovalHistory}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredHistory.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400">No approval history found.</p>
      )}

      {!loading && !error && filteredHistory.length > 0 && (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 uppercase tracking-wider dark:text-gray-400">
                  Project Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 uppercase tracking-wider dark:text-gray-400">
                  Submitted By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 uppercase tracking-wider dark:text-gray-400">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 uppercase tracking-wider dark:text-gray-400">
                  Work Done
                </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 uppercase tracking-wider dark:text-gray-400">
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 uppercase tracking-wider dark:text-gray-400">
                  Updated On
                </th>
                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black-500 uppercase tracking-wider dark:text-gray-400">
                  Submitted On
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {filteredHistory.map((item) => (
                <tr key={item.update_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-white">
                    {item.project_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.submitted_by}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs overflow-hidden text-ellipsis">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs overflow-hidden text-ellipsis">
                    {item.work_done}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.progress_percent}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.approval_status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      item.approval_status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {item.approval_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.approved_on}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {item.submitted_on}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagerApprovalHistory;
