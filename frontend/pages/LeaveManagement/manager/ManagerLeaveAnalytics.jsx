import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ManagerLeaveAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/organization/leaves/manager/leave-analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalyticsData(res.data || []);
      } catch (err) {
        console.error('Failed to fetch manager analytics:', err);
      }
    };

    fetchAnalytics();
  }, []);

  const chartData = {
    labels: analyticsData.map((item) => item.type),
    datasets: [
      {
        label: 'Allowed',
        data: analyticsData.map((item) => item.allowed),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Used',
        data: analyticsData.map((item) => item.used),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
      {
        label: 'Remaining',
        data: analyticsData.map((item) => item.remaining),
        backgroundColor: 'rgba(244, 63, 94, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10 }
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">📊 Team Leave Analytics</h2>
      {analyticsData.length > 0 ? (
        <Bar data={chartData} options={chartOptions} />
      ) : (
        <p className="text-gray-500 italic">No analytics data available.</p>
      )}
    </div>
  );
};

export default ManagerLeaveAnalytics;
