// pages/TaskManagement/manager/utils.jsx
// Renamed from utils.js to utils.jsx because it contains JSX syntax (e.g., <Input />, <Label />)
import axios from "axios";
import {
  MdOutlineBugReport,
  MdOutlineAssignment,
  MdOutlineExplore,
  MdInfoOutline, // Used as default for getIssueTypeIcon
  MdAccessTime,
  MdPersonOutline,
  MdOutlineCategory,
  MdHourglassEmpty,
  MdCheckCircle,
  MdAttachFile,
  MdComment,
  MdTimer,
  MdHistory,
  MdCalendarToday,
  MdEdit,
  MdDelete,
  MdAdd,
  MdSearch,
  MdClose,
  MdFullscreen,
  MdFullscreenExit,
  MdFolderOpen,
} from 'react-icons/md';
import { IoTimerOutline } from "react-icons/io5";

// --- API Configuration ---
export const API_BASE_URL = 'http://localhost:5001/api';
axios.defaults.withCredentials = true;

// --- Helper Functions for Icons and Colors ---
export const getIssueTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'story': return <MdOutlineExplore className="text-green-500" />;
    case 'task': return <MdOutlineAssignment className="text-blue-500" />;
    case 'bug': return <MdOutlineBugReport className="text-red-500" />;
    case 'epic': return <MdFolderOpen className="text-purple-500" />; // Added Epic icon
    default: return <MdInfoOutline className="text-gray-500" />;
  }
};

export const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'highest': return 'bg-red-600';
    case 'high': return 'bg-red-400';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    case 'lowest': return 'bg-gray-400';
    default: return 'bg-gray-300';
  }
};

// Helper: Get hex color for status name (ensure these match your backend status names)
export const getStatusColorHex = (statusName) => {
  switch (statusName?.toLowerCase()) {
    case 'to do': return '#EF4444'; // Red-500
    case 'in progress': return '#F59E0B'; // Yellow-500
    case 'done': return '#10B981'; // Green-500
    case 'backlog': return '#6B7280'; // Gray-500
    case 'selected for development': return '#6D28D9'; // Violet-700 (example)
    case 'in review': return '#0EA5E9'; // Sky-500 (example)
    case 'closed': return '#4B5563'; // Gray-700 (example)
    default: return '#9CA3AF'; // Default gray
  }
};

// Helper to sort issues by priority (Highest to Lowest)
export const sortIssuesByPriority = (issues) => {
  const priorityOrder = {
    'highest': 5,
    'high': 4,
    'medium': 3,
    'low': 2,
    'lowest': 1,
  };

  return [...issues].sort((a, b) => {
    const priorityA = priorityOrder[a.priority?.toLowerCase()] || 0;
    const priorityB = priorityOrder[b.priority?.toLowerCase()] || 0;
    return priorityB - priorityA; // Descending order
  });
};

// Helper to get initials for user/team name
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ').filter(Boolean); // Split by space and remove empty strings
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase(); // Take first char if only one word
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Helper to format date strings to a readable format
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper to format date-time strings to a readable format
export const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// --- Reusable Form Components (contain JSX) ---
export const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-1 dark:text-gray-300">
    {children}
  </label>
);

export const Input = ({ name, value, onChange, type = "text", placeholder, required, disabled }) => (
  <input
    type={type}
    name={name}
    id={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    disabled={disabled}
    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
  />
);

export const TextArea = ({ name, value, onChange, placeholder, rows = 3, disabled }) => (
  <textarea
    name={name}
    id={name}
    value={value}
    onChange={onChange}
    rows={rows}
    placeholder={placeholder}
    disabled={disabled}
    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
  ></textarea>
);

export const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '42px',
    borderRadius: '8px',
    borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '&:hover': {
      borderColor: state.isFocused ? '#6366f1' : '#9ca3af',
    },
    transition: 'all 0.2s ease-out',
    backgroundColor: 'white',
    fontSize: '0.875rem',
    color: '#1f2937', // Ensure text color is dark for light background
    // Dark mode overrides
    '.dark &': {
      backgroundColor: '#1F2937', // dark:bg-gray-800
      borderColor: state.isFocused ? '#6366f1' : '#4B5563', // dark:border-gray-600
      color: '#F9FAFB', // dark:text-white
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#e0e7ff' : (state.isFocused ? '#f3f4f6' : 'white'),
    color: state.isSelected ? '#4f46e5' : '#1f2937',
    fontSize: '0.875rem',
    '&:active': {
      backgroundColor: '#c7d2fe',
    },
    // Dark mode overrides
    '.dark &': {
      backgroundColor: state.isSelected ? '#3B82F6' : (state.isFocused ? '#374151' : '#1F2937'), // blue-500 selected, gray-700 focused, gray-800 normal
      color: state.isSelected ? '#FFFFFF' : (state.isFocused ? '#F9FAFB' : '#F9FAFB'), // white selected, white focused, white normal
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1f2937',
    '.dark &': {
      color: '#F9FAFB',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
    '.dark &': {
      color: '#9CA3AF',
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 100, // Ensure dropdown is above other elements
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // shadow-lg
    backgroundColor: 'white',
    '.dark &': {
      backgroundColor: '#1F2937', // dark:bg-gray-800
    },
  }),
};

export const parseDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Helper function to generate a project key preview from the project name.
 * This is a synchronous version for frontend display.
 * It does NOT check for uniqueness against the database.
 * @param {number} projectId - The ID of the selected project.
 * @param {string} issueTitle - The title of the issue.
 * @param {object} projectKeysMap - A map of projectId to projectKey (e.g., { 1: 'EN', 2: 'C' }).
 * @returns {string} The generated issue key preview (e.g., "EN-").
 */
export function generateIssueKeyPreview(projectId, issueTitle, projectKeysMap) {
  const projectKey = projectKeysMap[projectId];
  if (!projectKey) {
    return ''; // No project selected or project key not found
  }
  return `${projectKey}-`;
}

// Export all icons for easy import in other components
export {
  MdOutlineBugReport,
  MdOutlineAssignment,
  MdOutlineExplore,
  MdAdd,
  MdSearch,
  MdPersonOutline,
  MdOutlineCategory,
  MdAccessTime,
  MdInfoOutline,
  MdClose,
  MdFullscreen,
  MdFullscreenExit,
  MdFolderOpen,
  IoTimerOutline,
  MdComment,
  MdTimer,
  MdHistory,
  MdCalendarToday,
  MdCheckCircle,
  MdHourglassEmpty,
  MdEdit,
  MdDelete,
  MdAttachFile,
};
