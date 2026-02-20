import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle } from "lucide-react";



const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [remarksMap, setRemarksMap] = useState({});
  const [userId, setUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.userId);
      } catch (err) {
        console.error("JWT decode error:", err);
      }
    }
  }, [token]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("/api/manager/leave-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    let filteredData = [...requests];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredData = filteredData.filter(
        (r) =>
          r.employee_name?.toLowerCase().includes(q) ||
          r.type?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      filteredData = filteredData.filter((r) => r.status === statusFilter);
    }

    setFiltered(filteredData);
    setCurrentPage(1);
  }, [requests, searchQuery, statusFilter]);

  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentRequests = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleAction = async (id, status) => {
    try {
      await axios.patch(
        `/api/manager/leave-requests/${id}`,
        {
          status,
          remarks: remarksMap[id] || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
    } catch (err) {
      console.error(`Action error for ${id}:`, err);
    }
  };

  const handleSaveRemarks = async (id) => {
    try {
      await axios.patch(
        `/api/manager/leave-requests/${id}`,
        {
          remarks: remarksMap[id] || "",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
    } catch (err) {
      console.error(`Failed to save remarks for ${id}:`, err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Team Leave Requests</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Search by employee or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:max-w-md"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full sm:w-40"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {currentRequests.length === 0 ? (
        <p className="text-gray-500 text-center mt-4">No leave requests to show.</p>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200 text-sm">
    <thead className="bg-gray-100 text-gray-700">

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
                {currentRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-2">{req.employee_name}</td>
                    <td className="px-4 py-2">{req.type}</td>
                    <td className="px-4 py-2">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="px-4 py-2">{req.reason}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                    <td className="px-4 py-2">
                      <textarea
                        placeholder="Remarks..."
                        className="w-full border rounded p-1 text-sm mb-1"
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
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                    </td>
                    
                    <td className="px-4 py-2">
                      {req.supporting_document ? (
                        <a
                          href={`/uploads/${req.supporting_document}`}
                          className="text-blue-600 underline text-xs"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-4 py-2 space-y-2">
                      {req.status === "Pending" &&
 (userId === req.employee?.manager_id_primary || userId === req.employee?.manager_id_secondary) ? (
  <div className="flex gap-3 items-center justify-center">
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
) : (
  <span className="text-xs italic text-gray-400">No action required</span>
)}


                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded text-sm ${
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

export default LeaveRequests;
