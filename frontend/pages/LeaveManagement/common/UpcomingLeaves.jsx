
import React, { useEffect, useState } from 'react';
import axios from 'axios';


const UpcomingLeaves = () => {
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    fetchUpcomingLeaves();
  }, []);

  const fetchUpcomingLeaves = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/organization/leaves/upcoming', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("📦 upcoming leaves API response:", res.data);
    setLeaves(res.data);
  } catch (err) {
    console.error("❌ Failed to fetch upcoming leaves:", err.response?.data || err.message);
    setLeaves([]); // Prevent crash
  }
};


  return (
    <div className="w-full mt-10">
      <h3 className="text-xl font-semibold mb-4">Upcoming Leaves</h3>
      {leaves.length === 0 ? (
        <p className="text-gray-500">No upcoming leave requests found.</p>
      ) : (
        <table className="w-full border rounded text-sm bg-white">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2 border">Employee</th>
              <th className="p-2 border">Leave Type</th>
              <th className="p-2 border">Start</th>
              <th className="p-2 border">End</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(leaves) && leaves.map((lv) => (

              <tr key={lv.id}>
                <td className="p-2 border">{lv.employee_name || 'N/A'}</td>
                <td className="p-2 border">{lv.leave_type ?? lv.type}</td>
                <td className="p-2 border">{lv.start_date}</td>
                <td className="p-2 border">{lv.end_date}</td>
                <td className="p-2 border">{lv.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UpcomingLeaves;
