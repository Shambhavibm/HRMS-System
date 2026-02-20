import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = '/api/v1/notifications';
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  };

  const fetchNotificationsData = async () => {
    try {
      const countResponse = await fetch(`${API_BASE_URL}/unread/count`, {
        headers: authHeaders,
      });
      if (!countResponse.ok) {
        throw new Error(`HTTP error! status: ${countResponse.status} for unread count`);
      }
      const countData = await countResponse.json();
      if (countData.success) {
        setUnreadCount(countData.count);
      } else {
        console.error('Failed to fetch unread count:', countData.message);
      }

      const notifsResponse = await fetch(`${API_BASE_URL}?limit=5&status=unread`, {
        headers: authHeaders,
      });
      if (!notifsResponse.ok) {
        throw new Error(`HTTP error! status: ${notifsResponse.status} for recent notifications`);
      }
      const notifsData = await notifsResponse.json();
      if (notifsData.success) {
        setNotifications(notifsData.data);
      } else {
        console.error('Failed to fetch recent notifications:', notifsData.message);
      }
    } catch (error) {
      console.error('Error in fetchNotificationsData:', error);
    }
  };

  // --- Polling Logic (Every 60 seconds) ---
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    fetchNotificationsData();  // Initial fetch on mount

    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        fetchNotificationsData();  // Poll every 60 seconds
      }, 60000);
    }

    return () => {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    };
  }, []);

  // --- Debounced Fetch on Dropdown Open ---
  const debouncedFetchNotificationsData = useRef(debounce(fetchNotificationsData, 10000)).current;

  useEffect(() => {
    if (isOpen) {
      debouncedFetchNotificationsData();  // Fetch fresh data when dropdown opens
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      debouncedFetchNotificationsData.cancel();  // Cleanup debounce on unmount
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read_status) {
      try {
        const response = await fetch(`${API_BASE_URL}/${notification.notification_id}/read`, {
          method: 'PATCH',
          headers: authHeaders,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n =>
          n.notification_id === notification.notification_id ? { ...n, read_status: true } : n
        ));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    setIsOpen(false);
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mark-all-read`, {
        method: 'PATCH',
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200 animate-fade-in-down">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No unread notifications.</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.notification_id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 ${
                    notif.read_status ? 'bg-gray-50 text-gray-600' : 'bg-white hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Bell size={18} className={`${notif.read_status ? 'text-gray-400' : 'text-blue-500'}`} />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className={`font-medium ${notif.read_status ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notif.title}
                      </p>
                      <p className={`text-sm ${notif.read_status ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notif.message.length > 80 ? notif.message.substring(0, 80) + '...' : notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => { navigate('/app/notifications'); setIsOpen(false); }}
              className="w-full text-center text-blue-600 hover:text-blue-800 py-2"
            >
              View All Notifications
            </button>
            <button
              onClick={() => { navigate('/app/settings/notifications'); setIsOpen(false); }}
              className="w-1/2 text-center text-gray-600 hover:text-gray-800 py-2 flex items-center justify-center text-sm"
            >
              <Settings size={16} className="mr-1" /> Preferences
            </button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
