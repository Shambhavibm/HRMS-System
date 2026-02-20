
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../../axiosSetup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const pastDaysAllowed = parseInt(import.meta.env.VITE_ALLOW_PAST_LEAVE_DAYS || '0', 10);

const isWeekday = (date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // Block Sundays and Saturdays
};



const getMinAllowedDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - pastDaysAllowed);
  date.setHours(0, 0, 0, 0);
  return date;
};


const ApplyLeave = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveQuota, setLeaveQuota] = useState([]);
  const [formData, setFormData] = useState({
    leave_type: '',
    start_date: null,
    end_date: null,
    reason: '',
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [gazettedHolidays, setGazettedHolidays] = useState([]);

  
  useEffect(() => {
    fetchLeaveTypes();
    fetchLeaveHistory();
  }, []);

  useEffect(() => {
  const fetchLocationBasedHolidays = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/holidays/location-based", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const categorized = res.data.map(h => ({
  id: h.id,
  name: h.name,
  date: h.date,
  type: h.type
}));
setGazettedHolidays(categorized);

    } catch (err) {
      console.error("Failed to fetch location-based holidays", err);
    }
  };

  fetchLocationBasedHolidays();
}, []);


  useEffect(() => {
    const fetchUserAndProcess = async () => {
      try {
        const token = localStorage.getItem('token');
        const userRes = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = userRes.data;

        const carryMap = {};
if (Array.isArray(user?.carryforwards)) {
  user.carryforwards.forEach(cf => {
    carryMap[cf.leave_type] = cf.carried_forward_days;
  });
}

const stats = leaveTypes.map(type => {
  const carry = carryMap[type.type] || 0;
  const base = type.max_days_per_year;
  const used = leaveHistory
    .filter(l => (l.leave_type || l.type) === type.type && l.status === 'Approved')
    .reduce((sum, l) => sum + l.total_days, 0);

  return {
    type: type.type,
    allowed: base + carry,
    carried_forward: carry,
    used,
    remaining: Math.max(base + carry - used, 0)
  };
});


        const filtered = stats.filter(type => {
          const name = type.type.toLowerCase();
          if (name === 'paternity leave') {
            return user.gender?.toLowerCase() === 'male' && user.marital_status?.toLowerCase() === 'married';
          }
          if (name === 'maternity leave') {
            return user.gender?.toLowerCase() === 'female' && user.marital_status?.toLowerCase() === 'married';
          }
          return true;
        });

        setLeaveQuota(filtered);
      } catch (err) {
        console.error('Error in processing leave quota', err);
      }
    };

    if (leaveTypes.length) fetchUserAndProcess();
  }, [leaveTypes, leaveHistory]);

  const fetchLeaveTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/organization/leave-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveTypes(res.data || []);
    } catch (err) {
      console.error('Failed to load leave types', err);
    }
  };

  const fetchLeaveHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/organization/leaves/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaveHistory(res.data || []);
    } catch (err) {
      console.error('Failed to fetch leave history', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const calculateRequestedDays = () => {
  const start = new Date(formData.start_date);
  const end = new Date(formData.end_date);
  if (!start || !end || end < start) return 0;

  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};


  const formatDate = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.start_date || !formData.end_date) {
      return setMessage({ type: 'error', content: 'Start and end dates are required.' });
    }

    const minAllowedDate = getMinAllowedDate(); // allowed backdate start
const maxAllowedDate = new Date(); // today, but not restricting future leaves anymore

if (formData.start_date < minAllowedDate || formData.end_date < minAllowedDate) {
  return setMessage({
    type: 'error',
    content: `Leave dates cannot be earlier than ${minAllowedDate.toISOString().split('T')[0]}.`
  });
}

if (formData.end_date < formData.start_date) {
  return setMessage({
    type: 'error',
    content: 'End date cannot be before start date.'
  });
}

  // Reset start_date and end_date time to 00:00:00 to avoid partial day mismatches
formData.start_date.setHours(0, 0, 0, 0);
formData.end_date.setHours(0, 0, 0, 0);

    const daysRequested = calculateRequestedDays();
    console.log("DEBUG:", { start: formData.start_date, end: formData.end_date, daysRequested });
    const quota = leaveQuota.find(q => q.type === formData.leave_type);

    if (!quota) {
      return setMessage({ type: 'error', content: 'Invalid leave type selected.' });
    }

    if (daysRequested <= 0) {
      return setMessage({ type: 'error', content: 'Leave duration must be at least 1 day.' });
    }

    if (quota.remaining < daysRequested) {
      return setMessage({
        type: 'error',
        content: `Insufficient balance. You have only ${quota.remaining} day(s) remaining for ${quota.type}.`
      });
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('leave_type', formData.leave_type);
      formDataToSend.append('start_date', formatDate(formData.start_date));
formDataToSend.append('end_date', formatDate(formData.end_date));

      formDataToSend.append('reason', formData.reason);
      formDataToSend.append('total_days', daysRequested);
      if (file) {
        formDataToSend.append('supporting_document', file);
      }

      await axios.post('/api/organization/leaves', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', content: '✅ Leave request submitted!' });
      setFormData({ leave_type: '', start_date: null, end_date: null, reason: '' });
      setFile(null);
      await fetchLeaveHistory();
      await fetchLeaveTypes();
    } catch (err) {
      console.error('Error submitting leave request', err);
      setMessage({ type: 'error', content: '❌ Failed to submit leave request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* Leave Summary */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Leave Balance Summary</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {leaveQuota.length === 0 ? (
            <div className="text-gray-500">No leave types configured for you yet.</div>
          ) : (
            leaveQuota.map((item) => {
              const usedPercent = (item.used / item.allowed) * 100;
              return (
                <div key={item.type} className="bg-white dark:bg-gray-900 rounded-lg p-5 border shadow-md hover:shadow-lg transition">
                  <h3 className="text-lg font-semibold text-indigo-600 mb-1">{item.type}</h3>
                  <p className="text-sm">
  Allowed: <strong>{item.allowed}</strong>
  {item.carried_forward > 0 && (
    <span className="text-gray-500 text-xs ml-1">
      ({item.allowed - item.carried_forward} base + {item.carried_forward} carry)
    </span>
  )}
</p>

                  <p className="text-sm">Used: <strong>{item.used}</strong></p>
                  <p className="text-sm mb-2">Remaining: <strong>{item.remaining}</strong></p>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${usedPercent < 70 ? 'bg-green-500' : usedPercent < 90 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${usedPercent}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Leave Application Form */}
      <section className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 transition">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white tracking-tight">📝 Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Leave Type</label>
            <select
              name="leave_type"
              value={formData.leave_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Leave Type --</option>
              {leaveQuota.map((type) => (
                <option key={type.type} value={type.type}>
  {type.type} — Remaining: {type.remaining} ({type.allowed - type.carried_forward} + {type.carried_forward})
</option>

              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
              <DatePicker
  selected={formData.start_date}
  onChange={(date) => setFormData((prev) => ({ ...prev, start_date: date }))}
  dateFormat="yyyy-MM-dd"
  placeholderText="Select start date"
  minDate={getMinAllowedDate()}
  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
/>


            </div>
            <div>
              <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">End Date</label>
              <DatePicker
  selected={formData.end_date}
  onChange={(date) => setFormData((prev) => ({ ...prev, end_date: date }))}
  dateFormat="yyyy-MM-dd"
  placeholderText="Select end date"
  minDate={formData.start_date || getMinAllowedDate()}
  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
/>


            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Reason</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Brief reason for your leave..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Supporting Document <span className="text-gray-400 text-xs">(optional)</span></label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
            />
          </div>

          {message.content && (
            <div className={`text-sm mt-2 font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.content}
            </div>
          )}

          <div className="text-right">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-md shadow-md hover:shadow-lg transition"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </section>
      {/* gazzeted leaves */}
<div className="mt-8">
  <h3 className="text-lg font-semibold mb-2">📅 Upcoming Holidays</h3>
<ul className="text-sm text-gray-700 space-y-1">
  {gazettedHolidays.map(h => (
    <li key={h.id} className="border-b pb-1">
      <span className="font-medium">
        {h.type === "optional" ? "Optional" : "Mandatory"}: {h.name}
      </span> – {h.date}
    </li>
  ))}
</ul>

</div>
 {/* gazzeted leaves */}
      {/* Leave History Table */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">My Leave Requests</h2>
        {leaveHistory.length === 0 ? (
          <p className="text-gray-500">You haven’t submitted any leave requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm text-left border rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Start</th>
                  <th className="px-4 py-2">End</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {leaveHistory.map((leave) => (
                  <tr key={leave.id} className="border-b dark:border-gray-700">
                    <td className="px-4 py-2">{leave?.type ?? leave?.leave_type}</td>
                    <td className="px-4 py-2">{leave.start_date}</td>
                    <td className="px-4 py-2">{leave.end_date}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        leave.status === 'Approved' ? 'bg-green-100 text-green-800'
                        : leave.status === 'Rejected' ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{leave.reason}</td>
                    <td>{leave.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ApplyLeave;
