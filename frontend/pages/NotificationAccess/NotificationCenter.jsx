// pages/NotificationCenter.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Archive, Search, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('unread');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const notificationsPerPage = 10;
  const navigate = useNavigate();

  const debounceRef = useRef(null); 

  const API_BASE_URL = '/api/v1/notifications';
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  };

  // ✅ Updated fetchNotifications with raw response logging
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        status: filterStatus,
        type: filterType,
        search: searchTerm,
        limit: notificationsPerPage,
        offset: (currentPage - 1) * notificationsPerPage,
      }).toString();

      const response = await fetch(`${API_BASE_URL}?${queryParams}`, {
        headers: authHeaders,
      });

      const text = await response.text(); // read raw text
      try {
        const data = JSON.parse(text);
        if (data.success) {
          setNotifications(data.data);
          setTotalPages(Math.ceil(data.total / notificationsPerPage));
        } else {
          setError(data.message || 'Failed to fetch notifications.');
        }
      } catch (err) {
        console.error("❌ Invalid JSON returned:", text); // debug unexpected output
        setError("Unexpected response from server.");
      }

    } catch (err) {
      console.error('❌ Network error while fetching notifications:', err);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchNotifications();
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceRef.current);
  }, [filterStatus, filterType, searchTerm, currentPage]);


  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/read`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, read_status: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleArchive = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/archive`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
    } catch (err) {
      console.error('Failed to archive:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mark-all-read`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      fetchNotifications(); // re-fetch after bulk update
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_status_change': return <CheckCircle className="text-green-500" />;
      case 'leave_approval': return <CheckCircle className="text-blue-500" />;
      case 'project_comment': return <Bell className="text-purple-500" />;
      case 'new_post': return <Bell className="text-orange-500" />;
      case 'message': return <Bell className="text-indigo-500" />;
      case 'task_assigned': return <Bell className="text-cyan-500" />;
      case 'document_shared': return <Bell className="text-lime-500" />;
      case 'new_employee': return <Bell className="text-pink-500" />;
      default: return <Bell className="text-gray-500" />;
    }
  };

  return (
    <div className="p-6 min-h-screen font-sans">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <Bell className="mr-3 text-blue-600" size={30} /> Your Notifications
        </h1>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="relative w-full sm:w-auto flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search notifications..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-400 focus:border-blue-400 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="p-2 border border-gray-300 rounded-md shadow-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="all">All</option>
          </select>
          <select
            className="p-2 border border-gray-300 rounded-md shadow-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="task_status_change">Task Status Change</option>
            <option value="leave_approval">Leave Approval</option>
            <option value="project_comment">Project Comment</option>
            <option value="new_post">New Announcement</option>
            <option value="message">Message</option>
            <option value="task_assigned">Task Assigned</option>
            <option value="document_shared">Document Shared</option>
            <option value="new_employee">New Employee</option>
          </select>
          <button
            onClick={handleMarkAllRead}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <CheckCircle size={18} className="mr-2" /> Mark All As Read
          </button>
          <button
            onClick={() => navigate('/app/settings/notifications')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center"
          >
            <Settings size={18} className="mr-2" /> Preferences
          </button>
        </div>

        {loading && <div className="text-center py-8 text-lg text-gray-600">Loading notifications...</div>}
        {error && <div className="text-center py-8 text-lg text-red-500">Error: {error}</div>}
        {!loading && !error && notifications.length === 0 && (
          <div className="text-center py-8 text-lg text-gray-500">No notifications found.</div>
        )}

        <div className="space-y-4">
          {notifications.map(notif => (
            <div
              key={notif.notification_id}
              className="flex items-start space-x-4 p-4 hover:bg-gray-50 transition border-b border-gray-100"
            >
              {/* Left Icon or Avatar */}
              <div className="mt-1">
                <div className="bg-blue-100 p-2 rounded-full">
                  {getNotificationIcon(notif.notification_type)}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-grow">
                <div className="flex justify-between">
                  <p className="font-semibold text-gray-900">
                    {notif.title}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(notif.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                
                {/* Action Buttons */}
                <div className="flex space-x-4 text-sm mt-2">
                  {notif.link_url && (
                    <button
                      onClick={() => {
                        handleMarkAsRead(notif.notification_id);
                        const cleanPath = notif.link_url.startsWith('/app') ? notif.link_url.replace('/app', '') : notif.link_url;
                        navigate(cleanPath);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
                  )}
                  {!notif.read_status && (
                    <button
                      onClick={() => handleMarkAsRead(notif.notification_id)}
                      className="text-green-600 hover:underline"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleArchive(notif.notification_id)}
                    className="text-gray-500 hover:underline"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
