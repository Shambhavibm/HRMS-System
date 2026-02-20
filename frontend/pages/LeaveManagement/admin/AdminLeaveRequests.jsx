

import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle } from "lucide-react";


const AdminLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [remarksMap, setRemarksMap] = useState({});
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestsPerPage = 10;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("✅ Decoded Token:", payload);

        setUserId(payload.userId);
        setUserRole(payload.role); // 👈 role decoded
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, [token]);
  
  const fetchAdminRequests = async () => {
    try {
      const res = await axios.get("/api/admin/leave-requests", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: requestsPerPage,
          search: searchQuery,
          status: statusFilter !== "All" ? statusFilter : undefined,
        },
      });

      const { data, totalPages } = res.data;
      setRequests(Array.isArray(data) ? data : []);
      setTotalPages(totalPages || 1);
    } catch (err) {
      console.error("Error fetching admin leave requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminRequests();
  }, [currentPage, searchQuery, statusFilter]);

  const handleAction = async (id, status) => {
    try {
      await axios.patch(
        `/api/admin/leave-requests/${id}`,
        { status, remarks: remarksMap[id] || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdminRequests();
    } catch (err) {
      console.error(`Failed to update status for request ${id}:`, err);
    }
  };

  const handleSaveRemarks = async (id) => {
    try {
      await axios.patch(
        `/api/admin/leave-requests/${id}`,
        { remarks: remarksMap[id] || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAdminRequests();
    } catch (err) {
      console.error(`Failed to save remarks for request ${id}:`, err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Employee Leave Requests</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Search by name or type..."
          className="border border-gray-300 px-3 py-2 rounded w-full sm:max-w-md"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <select
          className="border border-gray-300 px-3 py-2 rounded w-full sm:w-40"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">No leave requests match your filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Dates</th>
                  <th className="px-4 py-3 text-left font-semibold">Reason</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Remarks</th>
                  <th className="px-4 py-3 text-left font-semibold">Document</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => {
                  console.log("🔍 Row Check:", {
  request_id: req.id,
  approver_id: req.approver_id,
  approver_role: req.approver_role,
  request_status: req.status,
  current_userId: userId,
  current_userRole: userRole
});

                  const canAct =
  req.status === "Pending" &&
  Number(userId) === Number(req.approver_id) &&
  req.approver_role === "admin" &&
  userRole === "admin";


                  return (
                    <tr key={req.id}>
                      <td className="px-4 py-3">{req.employee_name}</td>
                      <td className="px-4 py-3">{req.type}</td>
                      <td className="px-4 py-3">
                        {req.start_date} → {req.end_date}
                      </td>
                      <td className="px-4 py-3">{req.reason}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            req.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : req.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          className="w-full text-sm p-1 border border-gray-300 rounded"
                          placeholder="Remarks..."
                          value={remarksMap[req.id] || ""}
                          onChange={(e) =>
                            setRemarksMap((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          onClick={() => handleSaveRemarks(req.id)}
                          className="mt-1 text-xs px-2 py-1 bg-blue-600 text-white rounded"
                        >
                          Save Remarks
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {req.supporting_document ? (
                          <a
                            href={`/uploads/${req.supporting_document}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canAct ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
  <button
    onClick={() => handleAction(req.id, "approved")}
    title="Approve"
    className="text-green-600 hover:text-green-700"
  >
    <CheckCircle size={20} />
  </button>
  <button
    onClick={() => handleAction(req.id, "rejected")}
    title="Reject"
    className="text-red-600 hover:text-red-700"
  >
    <XCircle size={20} />
  </button>
</div>

                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No action required
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 text-sm rounded ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminLeaveRequests;
