import React, { useState, useEffect } from 'react';
import { Settings, Bell, Mail, MessageSquare } from 'lucide-react';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const API_BASE_URL = '/api/v1/notifications/preferences';

  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_BASE_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data);
        } else {
          setMessage(data.message || 'Failed to load preferences.');
          setIsSuccess(false);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
        setMessage('An error occurred while loading preferences.');
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleChange = (e) => {
    const { name, checked, type } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_BASE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success) {
        setMessage('Preferences updated successfully!');
        setIsSuccess(true);
        setPreferences(data.data);
      } else {
        setMessage(data.message || 'Failed to save preferences.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('An error occurred while saving preferences.');
      setIsSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-8 text-lg">Loading preferences...</div>;
  if (!preferences) return <div className="text-center p-8 text-lg text-red-500">Could not load preferences.</div>;

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#f9fafb]">
      <div className="bg-white rounded-xl shadow-md max-w-4xl mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Settings size={24} className="text-indigo-600" />
            Notification Preferences
          </h1>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md text-sm ${isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Global Notification Toggles */}
          <section>
            <h2 className="text-lg font-medium text-gray-700 mb-3">Global Settings</h2>
            <div className="divide-y divide-gray-200 border rounded-lg bg-gray-50">
              {[
                {
                  label: 'Receive In-App Notifications',
                  icon: <Bell size={20} className="text-blue-500" />,
                  name: 'receive_in_app',
                  checked: preferences.receive_in_app,
                },
                {
                  label: 'Receive Email Notifications',
                  icon: <Mail size={20} className="text-red-500" />,
                  name: 'receive_email',
                  checked: preferences.receive_email,
                },
                {
                  label: 'Receive SMS Notifications (if available)',
                  icon: <MessageSquare size={20} className="text-green-500" />,
                  name: 'receive_sms',
                  checked: preferences.receive_sms,
                },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between px-4 py-3">
                  <label htmlFor={item.name} className="flex items-center gap-2 text-gray-800 text-sm">
                    {item.icon}
                    {item.label}
                  </label>
                  <input
                    type="checkbox"
                    id={item.name}
                    name={item.name}
                    checked={item.checked}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
              ))}
            </div>
          </section>

          <div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-md transition duration-150 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationPreferences;
