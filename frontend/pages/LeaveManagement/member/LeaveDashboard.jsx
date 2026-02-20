
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../../axiosSetup';

const LeaveDashboard = () => {
  const [leaveStats, setLeaveStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/organization/leaves/member/leave-stats');
      console.log("📦 leave-stats API response:", res.data);

      setLeaveStats(res.data || []);
    } catch (err) {
      console.error('Failed to fetch leave stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <p className="p-6">Loading leave stats...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Leave Summary</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {leaveStats.map((item) => {
          const percentageUsed = (item.used / item.allowed) * 100;
          return (
            <div key={item.type} className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md border">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">{item.type}</h3>
              <p className="text-sm">
  Allowed: <strong>{item.allowed}</strong>{' '}
  {item.carried_forward > 0 && (
    <span className="text-gray-500 text-xs">
      ({item.allowed - item.carried_forward} base + {item.carried_forward} carry)
    </span>
  )}
</p>

              <p className="text-sm">Used: <strong>{item.used}</strong></p>
              <p className="text-sm">Remaining: <strong>{item.remaining}</strong></p>

              <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${percentageUsed < 70 ? 'bg-green-500' : percentageUsed < 90 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaveDashboard;
