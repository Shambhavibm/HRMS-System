import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Download, Plus, BarChart3, Settings, FileSearch,
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import HolidaySettings from "./HolidaySettings";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const LeaveSettings = () => {
  const [activeTab, setActiveTab] = useState('leave-types');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [auditLeaves, setAuditLeaves] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [role, setRole] = useState(null);
  const [teamList, setTeamList] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({ total: 0, available: 0, onLeave: 0 });
  const [carryforwardYear, setCarryforwardYear] = useState(new Date().getFullYear());
 const [carryViewYear, setCarryViewYear] = useState(new Date().getFullYear() - 1);
 const [carryRecords, setCarryRecords] = useState([]);
 const [carryPage, setCarryPage] = useState(1);
const carryItemsPerPage = 10;
 const [analyticsFilters, setAnalyticsFilters] = useState({
    startDate: '',
    endDate: '',
    leaveType: '',
    status: '',
    teamId: '',
  });

  useEffect(() => {
  fetchCarryforwardRecords(carryViewYear);
}, [carryViewYear]);

const fetchCarryforwardRecords = async (year) => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/admin/leave-carryforward', {
      headers: { Authorization: `Bearer ${token}` },
      params: { year }
    });
    setCarryRecords(res.data || []);
  } catch (err) {
    console.error('❌ Failed to fetch carryforward records:', err);
    setCarryRecords([]);
  }
};


  useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    setRole(payload.role);

    fetchLeaveTypes();
    fetchAuditLeaves();
    fetchTeams();

    const today = new Date().toISOString().split('T')[0];
    const defaultFilters = {
      startDate: today,
      endDate: today,
      leaveType: '',
      status: '',
      teamId: '',
    };
    setAnalyticsFilters(defaultFilters); // ✅ triggers fetchAnalytics from next useEffect
  }
}, []);

useEffect(() => {
  if (role && analyticsFilters.startDate) {
    fetchAnalytics(role, analyticsFilters); // ✅ single accurate call
  }
}, [analyticsFilters, role]);



  const fetchLeaveTypes = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/organization/leave-settings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setLeaveTypes(res.data);
  };

  const formatDateLocal = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};


  const fetchTeams = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/admin/teams', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTeamList(res.data || []);
  };

  const fetchAuditLeaves = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/organization/leaves/admin/audit-leaves', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setAuditLeaves(res.data || []);
  };

  const fetchAnalytics = async (userRole, filters = analyticsFilters) => {

  try {
    
    const token = localStorage.getItem('token');
    const endpoint = '/api/organization/leaves/analytics';


    const res = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,

    });
      console.log("📊 Received Analytics Data:", res.data);

    const raw = res.data;

    // 🧠 1. Handle chart data smartly
    const data = leaveTypes.map((lt) => {
  const used = raw.stats?.leaveTypes?.[lt.type] || 0;
  const eligibleCount = analyticsFilters.teamId && raw?.teamMemberCount
    ? raw.teamMemberCount
    : (employeeStats.total || 0);
  const allowed = (lt.max_days_per_year || 0) * eligibleCount;

  return {
    type: lt.type,
    allowed,
    used,
    remaining: Math.max(allowed - used, 0),
  };
});


    // ✅ 2. Safely extract employee stats (for Pie chart)
    const stats = raw?.employeeStats || raw?.stats || {};
    const total = stats.total || stats.totalEmployees || 0;
    const onLeave = stats.onLeave || stats.employeesOnLeave || 0;

    setEmployeeStats({
      total,
      onLeave,
      available: Math.max(total - onLeave, 0),
    });

    // ✅ 3. Save analytics dataset
    setAnalyticsData(data);

  } catch (err) {
    console.error('❌ Failed to fetch analytics data:', err);
  }
};

const applyQuickFilter = (type) => {
  const today = new Date();
  const newFilters = { ...analyticsFilters }; // preserve other filters (e.g., teamId)

  if (type === 'today') {
    const iso = today.toISOString().split('T')[0];
    newFilters.startDate = iso;
    newFilters.endDate = iso;
  } else if (type === 'week') {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    newFilters.startDate = startOfWeek.toISOString().split('T')[0];
    newFilters.endDate = endOfWeek.toISOString().split('T')[0];
  } else if (type === 'month') {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    newFilters.startDate = startOfMonth.toISOString().split('T')[0];
    newFilters.endDate = endOfMonth.toISOString().split('T')[0];
  }

  setAnalyticsFilters(newFilters); // will trigger useEffect
};


const resetFilters = () => {
  const newFilters = {
    startDate: '',
    endDate: '',
    leaveType: '',
    status: '',
    teamId: '',
  };

  setAnalyticsFilters(newFilters);
};



  const openModal = (type = null) => {
    setIsEdit(!!type);
    setSelected(type?.id || null);
    setModalData(
      type || {
        type: '',
        max_days_per_year: 0,
        carry_forward: false,
        encashable: false,
        description: '',
      }
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData({});
    setSelected(null);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (isEdit) {
      await axios.put(`/api/organization/leave-settings/${selected}`, modalData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      await axios.post('/api/organization/leave-settings', modalData, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    closeModal();
    fetchLeaveTypes();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave type?')) return;
    const token = localStorage.getItem('token');
    await axios.delete(`/api/organization/leave-settings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchLeaveTypes();
  };

   const handleCarryforward = async () => {
  try {
    const res = await axios.post('/api/admin/leave-carryforward/run', {
      year: carryforwardYear
    });
    toast.success(`Carryforward completed: ${res.data.records} records processed.`);
  } catch (err) {
    console.error('Carryforward error:', err);
    toast.error(err.response?.data?.error || 'Failed to run carryforward.');
  }
};


const paginatedCarry = carryRecords.slice(
  (carryPage - 1) * carryItemsPerPage,
  carryPage * carryItemsPerPage
);
const totalCarryPages = Math.ceil(carryRecords.length / carryItemsPerPage);

const downloadCarryforwardCSV = () => {
  const headers = ['Employee Name', 'Email', 'Leave Type', 'Year', 'Carried Forward Days'];

  const escapeCSV = (value) => {
    if (value == null) return '';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = carryRecords.map(r => [
    r.employee_name,
    r.email,
    r.leave_type,
    r.year,
    r.carried_forward_days
  ]);

  const csvData = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(','))
    .join('\n');

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `carryforward_${carryViewYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};


  const downloadCSV = () => {
 const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toISOString().split('T')[0]; // e.g., 2025-07-08
  };

  const escapeCSV = (value) => {
    if (value == null) return '';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };



  const headers = [
    'Name',
    'Email',
    'Leave Type',
    'Start Date',
    'End Date',
    'Total Days',
    'Status',
    'Reason',
    'Approved By ID',
    'Approved By Role'
  ];

  const rows = auditLeaves.map(lv => [
    lv.employee_name || '-',
    lv.email || '-',
    lv.leave_type || '-',
    formatDate(lv.start_date),
    formatDate(lv.end_date),
    lv.total_days || '-',
    lv.status || '-',
    lv.reason || '-',
    lv.approver_id || '-',
    lv.approver_role || '-'
  ]);

  const csvData = [headers, ...rows]
    .map(row => row.map(escapeCSV).join(','))
    .join('\n');

  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'audit_leaves.csv';
  a.click();
  URL.revokeObjectURL(url);
};



  const filteredLeaves = auditLeaves.filter(lv => {
    const searchMatch = lv.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lv.leave_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lv.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter ? lv.status === statusFilter : true;
    return searchMatch && statusMatch;
  });

  const paginatedLeaves = filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);


return (
  <div className="p-6">
    <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
      {/* Tab Header */}
      <div className="flex gap-4 border-b pb-2 text-gray-600 font-semibold">
        <button
          className={`px-4 py-2 transition-colors duration-200 border-b-2 ${
            activeTab === 'leave-types'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('leave-types')}
        >
          <Settings className="inline w-4 h-4 mr-1" /> Leave Types
        </button>
        <button
          className={`px-4 py-2 transition-colors duration-200 border-b-2 ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="inline w-4 h-4 mr-1" /> Leave Analytics
        </button>
        <button
          className={`px-4 py-2 transition-colors duration-200 border-b-2 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('audit')}
        >
          <FileSearch className="inline w-4 h-4 mr-1" /> Audit Leaves
        </button>
        <button
  className={`px-4 py-2 transition-colors duration-200 border-b-2 ${
    activeTab === 'holiday'
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-600 hover:text-blue-500'
  }`}
  onClick={() => setActiveTab('holiday')}
>
  🗓️ Holiday Calendar
</button>

      </div>

      {/* Leave Types Panel */}
      {activeTab === 'leave-types' && (
        <>
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => openModal()}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={16} /> Add Leave Type
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveTypes.map((lt) => (
              <div key={lt.id} className="bg-white border rounded-xl p-4 shadow hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-blue-600">{lt.type}</h3>
                    <p className="text-sm text-gray-500">{lt.description || 'No description.'}</p>
                  </div>
                  <div className="text-sm text-right">
                    <button onClick={() => openModal(lt)} className="text-blue-600 hover:underline block">Edit</button>
                    <button onClick={() => handleDelete(lt.id)} className="text-red-600 hover:underline block">Delete</button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <p><strong>Max Days:</strong> {lt.max_days_per_year}</p>
                  <p><strong>Carry Forward:</strong> {lt.carry_forward ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Encashable:</strong> {lt.encashable ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

             {/* carry forward */}
  {/* carry forward */}
<div className="mt-8 bg-white shadow rounded-lg p-6">
  <h2 className="text-lg font-semibold mb-4">🌀 Leave Carryforward</h2>

  {/* Run Carryforward Section */}
  <div className="flex items-center gap-4 mb-6">
    <label className="text-sm font-medium">Select Year:</label>
    <input
      type="number"
      value={carryforwardYear}
      onChange={(e) => setCarryforwardYear(e.target.value)}
      className="border px-3 py-1 rounded-md w-32"
    />
    <button
      onClick={handleCarryforward}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
    >
      Run Carryforward
    </button>
  </div>

  {/* View Carryforward Records */}
  <h3 className="text-md font-semibold mb-3">📋 Carried Forward Leaves for Year</h3>
  <div className="flex justify-between items-center mb-3">
    <div className="flex gap-2 items-center">
      <label className="text-sm">Select Year:</label>
      <input
        type="number"
        value={carryViewYear}
        onChange={(e) => {
          setCarryPage(1); // reset to first page
          setCarryViewYear(Number(e.target.value));
        }}
        className="border px-2 py-1 rounded w-28"
      />
    </div>
    <button
      onClick={downloadCarryforwardCSV}
      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
    >
      ⬇️ Download CSV
    </button>
  </div>

  <table className="w-full text-sm border rounded overflow-hidden">
    <thead className="bg-gray-100">
      <tr>
        <th className="p-2 text-left">Employee</th>
        <th className="p-2 text-left">Email</th>
        <th className="p-2 text-left">Leave Type</th>
        <th className="p-2 text-left">Year</th>
        <th className="p-2 text-left">Carried Days</th>
      </tr>
    </thead>
    <tbody>
      {paginatedCarry.length > 0 ? (
        paginatedCarry.map((r, idx) => (
          <tr key={idx} className="border-t">
            <td className="p-2">{r.employee_name}</td>
            <td className="p-2">{r.email}</td>
            <td className="p-2">{r.leave_type}</td>
            <td className="p-2">{r.year}</td>
            <td className="p-2">{r.carried_forward_days}</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="5" className="p-3 text-center text-gray-500">
            No carryforward records found.
          </td>
        </tr>
      )}
    </tbody>
  </table>

  {/* Pagination */}
  {totalCarryPages > 1 && (
    <div className="mt-4 flex justify-end items-center gap-4">
      <button
        disabled={carryPage === 1}
        onClick={() => setCarryPage((p) => p - 1)}
        className="px-3 py-1 border rounded"
      >
        Prev
      </button>
      <span>Page {carryPage} of {totalCarryPages}</span>
      <button
        disabled={carryPage === totalCarryPages}
        onClick={() => setCarryPage((p) => p + 1)}
        className="px-3 py-1 border rounded"
      >
        Next
      </button>
    </div>
  )}
</div>
    </>
      )}
     



      {/* carry forward */}
      {/* Leave Analytics Panel */}
      {activeTab === 'analytics' && (
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            📊 {role === 'admin' ? 'Organization-Wide' : 'Team'} Leave Analytics
          </h3>
          {/* Quick Filters */}
<div className="flex flex-wrap gap-3 mb-4">
  <button
    className="bg-gray-200 px-4 py-2 rounded hover:bg-blue-100"
    onClick={() => applyQuickFilter('today')}
  >
    📅 Today
  </button>
  <button
    className="bg-gray-200 px-4 py-2 rounded hover:bg-blue-100"
    onClick={() => applyQuickFilter('week')}
  >
    📊 This Week
  </button>
  <button
    className="bg-gray-200 px-4 py-2 rounded hover:bg-blue-100"
    onClick={() => applyQuickFilter('month')}
  >
    🗓️ This Month
  </button>

  <button
  className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200"
  onClick={resetFilters}
>
  🔄 Reset Filters
</button>

</div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <DatePicker
              selected={analyticsFilters.startDate ? parseISO(analyticsFilters.startDate) : null}
              onChange={(date) =>
                setAnalyticsFilters((prev) => ({
                  ...prev,
                  startDate:  formatDateLocal(date),
                }))
              }
              placeholderText="Start Date"
              className="border px-3 py-2 rounded w-full"
              dateFormat="yyyy-MM-dd"
            />
            <DatePicker
              selected={analyticsFilters.endDate ? parseISO(analyticsFilters.endDate) : null}
              onChange={(date) =>
                setAnalyticsFilters((prev) => ({
                  ...prev,
                  endDate: formatDateLocal(date),
                }))
              }
              placeholderText="End Date"
              className="border px-3 py-2 rounded w-full"
              dateFormat="yyyy-MM-dd"
            />
            <select
              value={analyticsFilters.leaveType}
              onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, leaveType: e.target.value })}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Leave Types</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.type}>{lt.type}</option>
              ))}
            </select>
            <select
              value={analyticsFilters.status}
              onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, status: e.target.value })}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select
              value={analyticsFilters.teamId}
              onChange={(e) => setAnalyticsFilters({ ...analyticsFilters, teamId: e.target.value })}
              className="border px-3 py-2 rounded"
            >
              <option value="">All Teams</option>
              {teamList.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {/* Bar Chart */}
          <Bar
  data={{
    labels: analyticsData.map((d) => d.type),
    datasets: [
      {
        label: 'Allowed',
        data: analyticsData.map((d) => d.allowed),
        backgroundColor: '#93c5fd',
      },
      {
        label: 'Used',
        data: analyticsData.map((d) => d.used),
        backgroundColor: '#60a5fa',
      },
      {
        label: 'Remaining',
        data: analyticsData.map((d) => d.remaining),
        backgroundColor: '#3b82f6',
      },
    ],
  }}
  options={{
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }}
/>

          

          {/* Pie Chart */}
          
        {/* Pie Chart */}
{Number.isFinite(employeeStats.available) && Number.isFinite(employeeStats.onLeave) ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-10">
    
    {/* Pie Chart Section */}
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-md w-full mx-auto">
      <h4 className="text-lg font-semibold text-gray-800 text-center mb-4">
        Employee Availability
      </h4>
      <Pie
        data={{
          labels: ['Available', 'On Leave'],
          datasets: [
            {
              data:
                employeeStats.available + employeeStats.onLeave === 0
                  ? [1, 0]
                  : [employeeStats.available, employeeStats.onLeave],
              backgroundColor: ['#10b981', '#ef4444'], // Teal and Red
              borderColor: ['#d1fae5', '#fee2e2'],
              borderWidth: 1,
              hoverOffset: 10,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 13, weight: '500' },
                color: '#4b5563',
                boxWidth: 18,
                padding: 15,
              },
            },
            tooltip: {
              backgroundColor: '#1f2937',
              titleColor: '#f9fafb',
              bodyColor: '#f9fafb',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              padding: 10,
              callbacks: {
                label: function (tooltipItem) {
                  const label = tooltipItem.label;
                  const value = tooltipItem.raw;
                  return `${label}: ${value}`;
                },
              },
            },
          },
        }}
      />
    </div>

    {/* Stats Summary Section */}
    <div className="space-y-6 px-4 text-center md:text-left">
      <div>
        <div className="text-sm uppercase tracking-wide text-gray-500 mb-1">
          Total Members
        </div>
        <div className="text-2xl font-bold text-gray-800">
          {employeeStats.total}
        </div>
      </div>
      <div>
        <div className="text-sm uppercase tracking-wide text-gray-500 mb-1">
          Available Today
        </div>
        <div className="text-xl font-semibold text-green-600">
          {employeeStats.available}
        </div>
      </div>
      <div>
        <div className="text-sm uppercase tracking-wide text-gray-500 mb-1">
          On Leave
        </div>
        <div className="text-xl font-semibold text-red-500">
          {employeeStats.onLeave}
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-4">
        Filtered by date, team, and leave status.
      </div>
    </div>

  </div>
) : (
  <div className="text-center text-gray-500 mt-6">
    Employee availability data not available.
  </div>
)}



        </div>
      )}



      {/* Audit Leaves Panel */}
      {activeTab === 'audit' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">📄 Audit Leaves</h3>
            <button onClick={downloadCSV} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
              <Download size={16} /> Download CSV
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name, type, reason"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-3 py-2 rounded">
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <table className="min-w-full text-sm border rounded overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Leave Type</th>
                <th className="p-2 text-left">Start</th>
                <th className="p-2 text-left">End</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLeaves.map((lv, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{lv.employee_name}</td>
                  <td className="p-2">{lv.email || '-'}</td>
                  <td className="p-2">{lv.leave_type}</td>
                  <td className="p-2">{lv.start_date}</td>
                  <td className="p-2">{lv.end_date}</td>
                  <td className="p-2">{lv.status}</td>
                  <td className="p-2">{lv.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end items-center gap-4">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded">Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded">Next</button>
          </div>
          
        </div>
      )}

      {activeTab === 'holiday' && (
  <div>
    <HolidaySettings />
  </div>
)}


      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px]">
            <h2 className="text-xl font-bold mb-4">{isEdit ? 'Edit Leave Type' : 'Add Leave Type'}</h2>
            {!isEdit && (
              <input
                type="text"
                placeholder="Leave Type"
                value={modalData.type}
                onChange={(e) => setModalData({ ...modalData, type: e.target.value })}
                className="w-full mb-2 p-2 border rounded"
              />
            )}
            <input
              type="number"
              placeholder="Max Days"
              value={modalData.max_days_per_year}
              onChange={(e) => setModalData({ ...modalData, max_days_per_year: parseInt(e.target.value) })}
              className="w-full mb-2 p-2 border rounded"
            />
            <textarea
              placeholder="Description"
              value={modalData.description}
              onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
              className="w-full mb-2 p-2 border rounded"
            />
            <label className="block mb-2">
              <input
                type="checkbox"
                checked={modalData.carry_forward}
                onChange={(e) => setModalData({ ...modalData, carry_forward: e.target.checked })}
              /> Carry Forward
            </label>
            <label className="block mb-4">
              <input
                type="checkbox"
                checked={modalData.encashable}
                onChange={(e) => setModalData({ ...modalData, encashable: e.target.checked })}
              /> Encashable
            </label>
            <div className="flex justify-end">
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">Save</button>
              <button onClick={closeModal} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
       </div> {/* closes the inner white box */}
  </div>   
  );         

};

export default LeaveSettings;
