
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, LineChart, Line, Legend, Cell
} from 'recharts';

// Category-color mapping
const categoryColors = {
 Hardware: '#4D96FF',
  Software: '#56CFE1',
  Resource: '#FF922B',
  Other: '#F15BB5'
};

const normalizeCategory = (category) => {
  const map = {
    hardware: 'Hardware',
    software: 'Software',
    resource: 'Resource',
    other: 'Other'
  };
  return map[category?.toLowerCase()] || 'Other';
};

const transformCostDataForIndividualBars = (data) => {
  const transformed = data.map((entry, index) => {
    const category = normalizeCategory(entry.category);
    const amount = parseFloat(entry.totalSpent);
    const date = new Date(entry.date).toLocaleDateString();

    if (!entry.projectName || isNaN(amount)) {
      console.warn('❌ Skipping invalid entry:', entry);
      return null;
    }

    return {
      id: `${entry.projectName}-${category}-${index}`,
      projectName: entry.projectName,
      itemName: entry.itemName,
      category,
      amount,
      date,
      color: categoryColors[category] || categoryColors.Other
    };
  }).filter(Boolean);
  return transformed;
};

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const { projectName, category, itemName, amount, date } = payload[0].payload;
    return (
      <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-300">
        <p><strong>Project:</strong> {projectName}</p>
        <p><strong>Category:</strong> {category}</p>
        <p><strong>Item:</strong> {itemName}</p>
        <p><strong>Amount:</strong> ₹{amount.toLocaleString()}</p>
        <p><strong>Date:</strong> {date}</p>
      </div>
    );
  }
  return null;
};

const AdminOverview = ({ costSummary, weeklyProgress }) => {
  const detailedCostData = transformCostDataForIndividualBars(costSummary || []);

  const CostBarChart = () => (
    <div className="mt-8">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Cost Summary</h2>

        {detailedCostData.length > 0 ? (
          <div className="min-w-[1000px]">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={detailedCostData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="projectName" height={60} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" isAnimationActive={false}>
                  {detailedCostData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex gap-4 mt-4 flex-wrap">
              {Object.entries(categoryColors).map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 italic">No cost summary data available.</p>
        )}
      </div>
    </div>
  );

  const WeeklyProgressChart = () => {
    console.log('📈 Weekly progress raw:', weeklyProgress);
    return (
      <div className="mt-8">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Progress Summary</h2>
          {weeklyProgress && weeklyProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyProgress} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="average_progress" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 italic">No weekly progress data available.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <CostBarChart />
      <WeeklyProgressChart />
    </div>
  );
};

export default AdminOverview;