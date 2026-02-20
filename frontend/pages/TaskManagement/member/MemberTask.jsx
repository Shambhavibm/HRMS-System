import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Select from 'react-select';
import DatePicker from 'react-datepicker'; // Included for completeness, though not actively used in this view
import 'react-datepicker/dist/react-datepicker.css';

// Icon imports
import {
  MdOutlineBugReport,
  MdOutlineAssignment,
  MdOutlineExplore,
  MdSearch,
  MdPersonOutline,
  MdOutlineCategory,
  MdAccessTime,
  MdInfoOutline,
  MdFullscreen,
  MdFullscreenExit,
  MdFolderOpen,
  MdClose, // Added MdClose for modal close button if needed
} from 'react-icons/md';
import { IoTimerOutline } from 'react-icons/io5';

// Import the IssueDetailModal component
import IssueDetailModal from '../manager/IssueDetailModal';
// Removed: import { useModal } from '../../../context/ModalContext'; // Removed as per request


// --- API Configuration ---
const API_BASE_URL = 'http://localhost:5001/api';
axios.defaults.withCredentials = true;

// --- Helper Functions for Icons and Colors ---
const getIssueTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'story': return <MdOutlineExplore className="text-green-500" />;
    case 'task': return <MdOutlineAssignment className="text-blue-500" />;
    case 'bug': return <MdOutlineBugReport className="text-red-500" />;
    default: return <MdInfoOutline className="text-gray-500" />;
  }
};

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'highest': return 'bg-red-600';
    case 'high': return 'bg-red-400';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    case 'lowest': return 'bg-gray-400';
    default: return 'bg-gray-300';
  }
};

const sortIssuesByPriority = (issues) => {
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
    return priorityB - priorityA;
  });
};

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// --- Reusable Select Styles ---
const selectStyles = {
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
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#e0e7ff' : state.isFocused ? '#f3f4f6' : 'white',
    color: state.isSelected ? '#4f46e5' : '#1f2937',
    fontSize: '0.875rem',
    '&:active': {
      backgroundColor: '#c7d2fe',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1f2937',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#9ca3af',
  }),
};

// --- IssueCard Component ---
// This component is now purely for display. The click handler is in KanbanColumn.
const IssueCard = ({ issue }) => {
  if (!issue) return null;

  return (
    <div
      // Removed draggable from here, moved to parent div in KanbanColumn
      className="bg-white rounded-lg shadow-sm p-4 mb-3 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-100 transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-800 mr-2">{issue.title}</h4>
        <div className={`flex-shrink-0 text-xs font-medium text-white px-2 py-0.5 rounded-full ${getPriorityColor(issue.priority)}`}>
          {issue.priority}
        </div>
      </div>
      {/* --- ADDED: Display Issue Key --- */}
      {issue.issue_key && (
        <p className="text-xs text-gray-500 mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
          {issue.issue_key}
        </p>
      )}
      {/* --- END ADDED --- */}
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-gray-700">
            {getIssueTypeIcon(issue.issue_type_name)}
            <span className="ml-1 font-medium">{issue.issue_type_name}</span>
          </span>
          {issue.story_points && (
            <span className="flex items-center">
              <IoTimerOutline className="text-gray-400" />
              <span className="ml-1 text-gray-600">{issue.story_points} SP</span>
            </span>
          )}
          {issue.time_spent > 0 && (
            <span className="flex items-center">
              <MdAccessTime className="text-gray-400" />
              <span className="ml-1 text-gray-600">{issue.time_spent}h</span>
            </span>
          )}
        </div>
        <div className="flex items-center">
          {issue.assignee_name ? (
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
              {issue.assignee_name}
            </span>
          ) : issue.team_name ? (
            <div className="flex items-center space-x-1">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-200 text-purple-800 text-xs font-bold flex-shrink-0">
                {getInitials(issue.team_name)}
              </span>
              <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                {issue.team_name}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// --- KanbanColumn Component ---
const KanbanColumn = ({ status, issues, onDropIssue, onOpenDetailModal }) => { // Added onOpenDetailModal
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const issueId = parseInt(e.dataTransfer.getData('issueId'));
    if (issueId && status.status_id) {
      onDropIssue(issueId, status.status_id);
    }
  };

  const sortedIssues = sortIssuesByPriority(issues);

  return (
    <div
      className="bg-gray-50 rounded-xl flex-shrink-0 w-80 p-4 mr-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">{status.status_name} <span className="text-gray-500 font-medium text-base">({issues.length})</span></h3>
      </div>
      <div className="min-h-[100px] max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-2">
        {sortedIssues.map(issue => (
          // Wrapped IssueCard in a div to attach drag and click handlers
          <div
            key={issue.issue_id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('issueId', issue.issue_id.toString())}
            onClick={() => onOpenDetailModal(issue.issue_id)} // Click handler to open modal
            className="cursor-pointer" // Add cursor pointer for better UX
          >
            <IssueCard issue={issue} />
          </div>
        ))}
        {!issues.length && (
          <div className="text-center text-gray-400 text-sm py-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-100">
            No issues here.
          </div>
        )}
      </div>
    </div>
  );
};
// --- MemberTask Component (Main Component) ---
const MemberTask = () => {
  // Removed useModal hook as per request
  const [statuses, setStatuses] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [boardTitle, setBoardTitle] = useState('My Tasks Board');
  const [filteredIssues, setFilteredIssues] = useState([]);
  // Local state for user details from token
  const [currentUser, setCurrentUser] = useState({ userId: null, userRole: '', organization_id: null });
  const [authLoading, setAuthLoading] = useState(true); // Keep authLoading for initial token check
  // State for the IssueDetailModal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  // Filters for the member dashboard
  const [filters, setFilters] = useState({
    projectId: '',
    assigneeId: '', // Default to empty, backend will handle 'All Relevant Tasks'
    type: '',
    search: '',
  });

  const [allProjectsOptions, setAllProjectsOptions] = useState([]);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [issueTypeFilterOptions, setIssueTypeFilterOptions] = useState([]);

useEffect(() => {
    let tempIssues = [...issues];
  
    // 1. Apply Issue Type Filter
    if (filters.type) {
      const typeId = parseInt(filters.type, 10);
      tempIssues = tempIssues.filter(issue => issue.issue_type_id === typeId);
    }
  
    // 2. Apply Search Filter
   // 2. Apply Search Filter
if (filters.search) {
  const lowercasedSearch = filters.search.toLowerCase();
  tempIssues = tempIssues.filter(issue =>
    (issue.title?.toLowerCase().includes(lowercasedSearch)) || // <- FIXED (was issue.issue_title)
    (issue.description?.toLowerCase().includes(lowercasedSearch)) ||
    (issue.issue_key?.toLowerCase().includes(lowercasedSearch))
  );
}


    // 3. Apply Assignee Filter
    if (filters.assigneeId) {
      tempIssues = tempIssues.filter(issue => issue.assignee_id === filters.assigneeId);
    }
  
    setFilteredIssues(tempIssues);
  }, [issues, filters.type, filters.search, filters.assigneeId]);

  // Effect to manage body overflow when in full screen or modal is open
  useEffect(() => {
    // Only hide overflow if in full screen. Modal will handle its own overflow.
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScreen]); // Removed showDetailModal from dependency


  // Authenticate user and set user details from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setCurrentUser({ userId: decoded.userId, userRole: decoded.role, organization_id: decoded.organization_id });
      } catch (e) {
        console.error("Error decoding token:", e);
        setError("Authentication error: Invalid token.");
        setCurrentUser({ userId: null, userRole: '', organization_id: null });
      }
    } else {
      setError("User not authenticated: No token found.");
      setCurrentUser({ userId: null, userRole: '', organization_id: null });
    }
    setAuthLoading(false);
  }, []); // Run only once on component mount


  // Load board data (statuses, issues, filter options)
  const loadBoardData = useCallback(async () => {
    if (authLoading || currentUser.userId === null) {
      // Wait for auth to complete or if userId is not available
      setLoading(false); // Ensure loading is false if we can't proceed
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // --- Fetch all auxiliary data for filters first ---
      const [
        statusesRes,
        usersRes,
        issueTypesRes,
        projectsRes,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/status-master`),
        axios.get(`${API_BASE_URL}/users`),
        axios.get(`${API_BASE_URL}/issue-types`),
        axios.get(`${API_BASE_URL}/projects`), // This now returns project_key
      ]);

      setStatuses(Array.isArray(statusesRes.data?.data) ? statusesRes.data.data : []);
      setIssueTypeFilterOptions(Array.isArray(issueTypesRes.data?.data) ? issueTypesRes.data.data.map(type => ({ value: type.issue_type_id, label: type.type_name })) : []);

      // Correctly map users data from backend (it returns raw array, not data.data, based on your controller)
      const allOrgUsers = Array.isArray(usersRes.data) ? usersRes.data : (Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);
      setAssigneeOptions(allOrgUsers.map(u => ({ value: u.user_id, label: `${u.first_name} ${u.last_name}` })));

      const fetchedProjects = Array.isArray(projectsRes.data)
        ? projectsRes.data
        : (Array.isArray(projectsRes.data?.data) ? projectsRes.data.data : []);
      setAllProjectsOptions(fetchedProjects.map(p => ({ value: p.project_id, label: p.project_name, projectKey: p.project_key }))); // Include projectKey

      // --- Prepare query parameters for issues, mimicking original logic for assigneeId ---
      const issueParams = {
        projectId: filters.projectId || '',
        // If assigneeId filter is empty, default to current user's ID for "My Tasks" view
        assigneeId: filters.assigneeId === '' ? currentUser.userId : filters.assigneeId, // Use currentUser.userId
        issueTypeId: filters.type || '',
        search: filters.search || '',
      };

      const cleanedParams = Object.fromEntries(
        Object.entries(issueParams).filter(([, value]) => value !== '')
      );

      // --- CRITICAL: This is the request that needs to work ---
      const issuesRes = await axios.get(`${API_BASE_URL}/assign-tasks`, { params: cleanedParams });
      setIssues(Array.isArray(issuesRes.data?.data) ? issuesRes.data.data : []);

    } catch (err) {
      console.error('Failed to load member dashboard data:', err.response?.data || err);
      let errorMessage = 'An unexpected error occurred.';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage = err.response.data?.message || err.response.statusText || `Server error: ${err.response.status}`;
        } else if (err.request) {
          errorMessage = 'Network error: No response from server. Please check if backend is running.';
        } else {
          errorMessage = err.message || 'Error setting up request.';
        }
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      setError(`Failed to load dashboard: ${errorMessage}`);
      toast.error(`Failed to load dashboard: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [filters, currentUser.userId, authLoading]);


  // Effect to fetch data whenever filters or currentUser.userId changes
  useEffect(() => {
    if (currentUser.userId && !authLoading) { // Only fetch if user ID is available and auth check is done
      loadBoardData();
    }
  }, [filters, currentUser.userId, authLoading, loadBoardData]);


  // Handle drag-and-drop status update
  const handleDropIssue = async (issueId, newStatusId) => {
    const originalIssues = [...issues];
    const updatedIssues = issues.map(issue =>
      issue.issue_id === issueId
        ? { ...issue, current_status_id: newStatusId }
        : issue
    );
    setIssues(updatedIssues);

    try {
      await axios.put(`${API_BASE_URL}/assign-tasks/${issueId}/status`, { newStatusId });
      toast.success("Issue status updated successfully!");
      loadBoardData(); // Reload data to ensure consistency and get latest timestamps/data
    } catch (err) {
      console.error('Failed to update issue status:', err.response?.data || err);
      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage = err.response.data?.message || err.response.statusText || `Server error: ${err.response.status}`;
        } else if (err.request) {
          errorMessage = 'Network error: No response from server. Please check if backend is running.';
        } else {
          errorMessage = err.message || 'Error setting up request.';
        }
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      setError(`Failed to update status: ${errorMessage}`);
      toast.error(`Failed to update status: ${errorMessage}`);
      setIssues(originalIssues); // Revert on error
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

const handleProjectFilterChange = (selectedOption) => {
    setFilters(prev => ({
      ...prev,
      projectId: selectedOption ? selectedOption.value : null,
      assigneeId: '',
    }));
    if (selectedOption) {
      setPrefillDataForForm({
        project_id: selectedOption.value,
        project_name: selectedOption.label,
        project_key: selectedOption.projectKey,
        team_id: selectedOption.team_id,
        team_name: selectedOption.team_name,
        project_manager_id: selectedOption.managerId,
        project_manager_name: selectedOption.managerName,
      });
    } else {
      setPrefillDataForForm(null);
    }
  };
  // Handler to open the detail modal
  const handleOpenDetailModal = useCallback((issueId) => {
    setSelectedIssueId(issueId);
    setShowDetailModal(true);
    // Removed: setModalOpen(true); // No longer informing global context
  }, []); // Removed setModalOpen from dependency

  // Handler to close the detail modal
  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedIssueId(null);
    // Removed: setModalOpen(false); // No longer informing global context
    loadBoardData(); // Refresh tasks after modal closes (in case status/description was updated)
  }, [loadBoardData]); // Removed setModalOpen from dependency

  // Handler for when a task's status is updated from within the modal
  const handleUpdateIssueStatus = useCallback((issueId, newStatusId) => {
    setIssues(prevTasks => prevTasks.map(task =>
      task.issue_id === issueId // Use issue_id as the unique identifier
        ? { ...task, current_status_id: newStatusId, currentStatus: { status_id: newStatusId, status_name: statuses.find(s => s.status_id === newStatusId)?.status_name || 'Unknown' } }
        : task
    ));
  }, [statuses]);


  // Main container classes for the Kanban board
  const boardContainerClasses = `
    bg-gradient-to-br from-gray-50 to-blue-50
    font-sans w-full max-w-full flex flex-col
    ${isFullScreen ? 'fixed inset-0 z-[9999] p-4' : 'min-h-screen overflow-y-auto'}
  `;

  // Classes for the inner content of the board (header + kanban columns)
  const innerBoardContentClasses = `
    flex flex-col flex-grow
    ${isFullScreen ? 'bg-white rounded-xl shadow-2xl overflow-hidden' : ''}
    ${isFullScreen ? 'h-full' : ''}
  `;

  // Kanban Columns container height calculation for full screen
  const kanbanColumnsContainerClasses = `
    flex overflow-x-auto py-6 px-4 custom-scrollbar flex-grow
  `;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 text-lg text-gray-700 animate-pulse">Loading your tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-lg text-red-600 bg-red-50 border border-red-200 rounded-lg m-4">
        Error: {error}
      </div>
    );
  }

  if (currentUser.userId === null) { // Check currentUser.userId
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 text-lg text-red-600">Please log in to view your tasks.</div>
      </div>
    );
  }

  return (
    <div className={boardContainerClasses}>
      <div className={innerBoardContentClasses}>
        {/* Header section */}
        <div className="sticky top-0 z-20 bg-white p-6 shadow-lg border-b border-gray-100 flex-shrink-0 overflow-x-hidden overflow-y-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 w-full px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex-shrink-0">
              {boardTitle}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 w-full md:w-auto">
              <div className="relative flex-shrink-0">
                <MdFolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Select
                  name="projectFilter"
                  options={allProjectsOptions}
                  value={allProjectsOptions.find(opt => opt.value === filters.projectId) || null}
                  onChange={handleProjectFilterChange}
                  styles={{
                    ...selectStyles,
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    control: (base, state) => ({
                      ...selectStyles.control(base, state),
                      paddingLeft: '2.5rem',
                      minWidth: '200px',
                    }),
                  }}
                  placeholder="All Projects"
                  isClearable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

               <div className="relative flex-shrink-0">
                              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                              <input
                                type="text"
                                placeholder="Search issues..."
                                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm shadow-sm min-w-[150px]"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                              />
                            </div>

              <div className="relative flex-shrink-0">
                <MdOutlineCategory className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white transition duration-200 text-sm shadow-sm min-w-[150px]"
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  {issueTypeFilterOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex-shrink-0"
                title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullScreen ? <MdFullscreenExit size={24} /> : <MdFullscreen size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Columns container */}
        <div className={kanbanColumnsContainerClasses}>
          {statuses.map(status => (
            <KanbanColumn
              key={status.status_id}
              status={status}
             issues={filteredIssues.filter(issue => issue.current_status_id === status.status_id)}
              onDropIssue={handleDropIssue}
              onOpenDetailModal={handleOpenDetailModal} // Pass the handler down
            />
          ))}
        </div>
      </div>

      {/* Issue Detail Modal */}
      {showDetailModal && selectedIssueId && (
        <IssueDetailModal
          issueId={selectedIssueId}
          onClose={handleCloseDetailModal}
          onUpdateIssueStatus={handleUpdateIssueStatus}
          statuses={statuses} // Pass all possible statuses to the modal
        />
      )}

      {/* Custom Scrollbar Styles and Animations */}
      <style>{`
        /* Custom Scrollbar for Kanban Columns */
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e0e7ff;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #818cf8;
          border-radius: 10px;
          border: 2px solid #e0e7ff;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }

        /* Datepicker styles override for Tailwind forms */
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container input {
          display: block;
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          color: #1f2937;
          transition: all 0.2s ease-out;
        }
        .react-datepicker__input-container input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
        }

        /* Fade In Animation for Modals/Loaders */
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        /* Scale In Animation for Modals */
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        /* Pulse for loading state */
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default MemberTask;
