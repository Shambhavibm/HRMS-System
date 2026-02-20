import React from "react";
import { Plus, Upload } from "lucide-react"; // ✅ Import missing icons
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Sidebar = ({ onAddClick, onBulkUploadClick, filters, onFilterChange }) => {
  const token = localStorage.getItem("token");
  const decodedToken = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const role = decodedToken?.role?.toLowerCase();

  const typeOptions = {
    admin: ["Holiday", "Announcement"],
    manager: ["Holiday", "Announcement", "Meeting", "Team Lunch"],
    member: ["Holiday", "Announcement", "Meeting", "Team Lunch"],
  };

  const scopeOptions = {
    admin: [],
    manager: ["organization", "team", "private"],
    member: ["organization", "team", "private"],
  };

  const currentTypeOptions = typeOptions[role] || [];
  const currentScopeOptions = scopeOptions[role] || [];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 p-4 shadow-md h-screen overflow-y-auto border-r border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Calendar Tools</h2>

      {/* ➕ Add Event (not for member) */}
      {role !== "member" && (
        <button
          onClick={onAddClick}
          className="w-full mb-3 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Event
        </button>
      )}

      {/* 📁 Bulk Upload (Admin only) */}
      {role === "admin" && (
        <button
          onClick={onBulkUploadClick}
          className="w-full mb-4 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Upload className="w-5 h-5 mr-2" />
          Bulk Upload
        </button>
      )}

      {/* 🔍 Filters */}
      <div className="space-y-5">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Filter by Type</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange("type", e.target.value)}
            className="w-full border px-3 py-2 rounded-md dark:bg-gray-800 dark:text-white"
          >
            <option value="">All</option>
            {currentTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Scope Filter (except admin) */}
        {role !== "admin" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Filter by Scope</label>
            <select
              value={filters.scope}
              onChange={(e) => onFilterChange("scope", e.target.value)}
              className="w-full border px-3 py-2 rounded-md dark:bg-gray-800 dark:text-white"
            >
              <option value="">All</option>
              {currentScopeOptions.map((scope) => (
                <option key={scope} value={scope}>
                  {scope.charAt(0).toUpperCase() + scope.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
