//admin/IssueDetailModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// --- HARDCODED API_BASE_URL FOR PREVIEW ---
const API_BASE_URL = "http://localhost:5001/api";
// --- END HARDCODED ---

// --- CONSTANTS ---
const ITEMS_PER_PAGE = 3; // Number of activity logs per page

// --- EMBEDDED UTILS FUNCTIONS ---
const getIssueTypeIcon = (typeName) => {
  switch (typeName?.toLowerCase()) {
    case 'story': return '📖'; // Story icon
    case 'task': return '✅'; // Task icon
    case 'bug': return '🐞'; // Bug icon
    case 'epic': return '🎯'; // Epic icon
    default: return '🎯'; // Default placeholder
  }
};

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'highest': return 'bg-red-700';
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-blue-500';
    case 'lowest': return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
};

// Helper: Get hex color for status name (ensure these match your backend status names)
const getStatusColorHex = (statusName) => {
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

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (isoString) => {
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
// --- END EMBEDDED UTILS FUNCTIONS ---

const IssueDetailModal = ({ issueId, onClose, onUpdateIssueStatus }) => {
  const [issueDetails, setIssueDetails] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [subIssues, setSubIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubIssues, setLoadingSubIssues] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('comments'); // Default to comments tab
  const [commentText, setCommentText] = useState('');
  const [loggedHours, setLoggedHours] = useState('');
  const [loggedMinutes, setLoggedMinutes] = useState('');
  const [logTimeComment, setLogTimeComment] = useState('');
  const [showLogTimeForm, setShowLogTimeForm] = useState(false); // Manages visibility of the log time form
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [epicIssueTypeId, setEpicIssueTypeId] = useState(null);

  // Pagination states for each tab
  const [commentsCurrentPage, setCommentsCurrentPage] = useState(1);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [allCurrentPage, setAllCurrentPage] = useState(1);

  // Effect to fetch Epic Issue Type ID
  useEffect(() => {
    const fetchEpicTypeId = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/issue-types`);
        const epicType = response.data.data.find(type => type.type_name.toLowerCase() === 'epic');
        if (epicType) {
          setEpicIssueTypeId(epicType.issue_type_id);
        }
      } catch (err) {
        console.error("Error fetching issue types to find Epic ID:", err);
      }
    };
    fetchEpicTypeId();
  }, []);

  const fetchIssueDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detailsResponse = await axios.get(`${API_BASE_URL}/assign-tasks/${issueId}`);
      const fetchedDetails = detailsResponse.data.data;
      setIssueDetails(fetchedDetails);
      setEditedDescription(fetchedDetails.description || '');

      const activityResponse = await axios.get(`${API_BASE_URL}/issues/${issueId}/activity`);
      setActivityLogs(activityResponse.data.data);

      if ((fetchedDetails.issueType?.type_name.toLowerCase() === 'epic' || fetchedDetails.issueType?.type_name.toLowerCase() === 'story')) {
  setLoadingSubIssues(true);
  try {
    const subIssuesResponse = await axios.get(`${API_BASE_URL}/assign-tasks/sub-issues/${issueId}`);
    setSubIssues(subIssuesResponse.data.data);
  } catch (subErr) {
    console.error("Error fetching sub-issues:", subErr.response?.data || subErr);
    toast.error(`Failed to load sub-issues: ${subErr.response?.data?.message || subErr.message || 'Server error'}`);
    setSubIssues([]);
  } finally {
    setLoadingSubIssues(false);
  }
} else {
  setSubIssues([]);
}

    } catch (err) {
      console.error("Error fetching issue details or activity:", err.response?.data || err);
      setError(`Failed to load issue details: ${err.response?.data?.message || err.message || 'Server error'}`);
      toast.error(`Failed to load issue details: ${err.response?.data?.message || err.message || 'Server error'}`);
    } finally {
      setLoading(false);
    }
  }, [issueId, epicIssueTypeId]);

  useEffect(() => {
    if (issueId) {
      fetchIssueDetails();
    }
  }, [issueId, fetchIssueDetails]);

  // Reset page when tab changes
  useEffect(() => {
    setCommentsCurrentPage(1);
    setHistoryCurrentPage(1);
    setAllCurrentPage(1);
    setShowLogTimeForm(false); // Hide log time form when changing tabs
  }, [activeTab]);

  const handleLogTime = async (e) => {
    e.preventDefault();

    const hours = parseFloat(loggedHours) || 0;
    const minutes = parseFloat(loggedMinutes) || 0;

    const totalHoursToLog = hours + (minutes / 60);

    if (totalHoursToLog <= 0) {
      toast.error("Please enter a positive duration for time logging.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/issues/${issueId}/log-time`, {
        hours: totalHoursToLog,
        comment: logTimeComment
      });
      toast.success("Time logged successfully!");
      setLoggedHours('');
      setLoggedMinutes('');
      setLogTimeComment('');
      setShowLogTimeForm(false); // Hide form after successful log
      fetchIssueDetails(); // Re-fetch details to update time tracking summary
    } catch (err) {
      console.error("Error logging time:", err.response?.data || err);
      toast.error(`Failed to log time: ${err.response?.data?.message || err.message || 'Server error'}`);
    }
  };

  const handleAddComment = async () => {
    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      toast.error("Comment cannot be empty.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/issues/${issueId}/comments`, {
        commentText: trimmedComment
      });
      toast.success("Comment added successfully!");
      setCommentText('');
      fetchIssueDetails();
    } catch (err) {
      console.error("Error adding comment:", err.response?.data || err);
      toast.error(`Failed to add comment: ${err.response?.data?.message || err.message || 'Server error'}`);
    }
  };

  const handleSaveDescription = async () => {
    if (!issueDetails) {
      toast.error("Issue details not loaded.");
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/assign-tasks/${issueId}`, {
        description: editedDescription
      });
      setIssueDetails(prev => ({
        ...prev,
        description: editedDescription
      }));
      toast.success("Description updated successfully!");
      setIsEditingDescription(false);
      fetchIssueDetails();
    } catch (err) {
      console.error("Error updating description:", err.response?.data || err);
      toast.error(`Failed to update description: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    }
  };

  const handleCancelDescriptionEdit = () => {
    setEditedDescription(issueDetails.description || '');
    setIsEditingDescription(false);
  };

  // Pagination helper functions
  const getPaginatedItems = (items, currentPage) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (items) => {
    return Math.ceil(items.length / ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white p-8 rounded-xl shadow-2xl text-center text-lg text-gray-700 animate-pulse">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          Loading issue details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-800 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!issueDetails) {
    return null;
  }

  const issueTypeIconText = getIssueTypeIcon(issueDetails.issueType?.type_name);
  const assigneeInitials = issueDetails.assignee?.full_name ? getInitials(issueDetails.assignee.full_name) : 'N/A';
  const reporterInitials = issueDetails.reporter?.full_name ? getInitials(issueDetails.reporter.full_name) : 'N/A';
  const isCurrentIssueEpic = issueDetails.issueType?.type_name.toLowerCase() === 'epic';

  // Filtered activity logs for each tab
  const commentsLogs = activityLogs.filter(log => log.activity_type === 'comment');
  const historyLogs = activityLogs.filter(log => log.activity_type !== 'comment');
  const allLogs = activityLogs; // All logs

  // Paginated data for each tab
  const paginatedComments = getPaginatedItems(commentsLogs, commentsCurrentPage);
  const paginatedHistory = getPaginatedItems(historyLogs, historyCurrentPage);
  const paginatedAll = getPaginatedItems(allLogs, allCurrentPage);

  // Total pages for each tab
  const totalCommentsPages = getTotalPages(commentsLogs);
  const totalHistoryPages = getTotalPages(historyLogs);
  const totalAllPages = getTotalPages(allLogs);

  // Function to render pagination controls
  const renderPaginationControls = (currentPage, totalPages, setPage) => {
    if (totalPages <= 1) return null; // Don't show pagination if only one page

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-4">
        <button
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Previous
        </button>
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => setPage(number)}
            className={`px-3 py-1 rounded-md text-sm ${
              number === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {number}
          </button>
        ))}
        <button
          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center pt-25 pb-10 z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[85vh] overflow-hidden flex flex-col transform scale-95 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          {/* Combined Parent Issue, Current Issue Key/Number, and Title */}
          <div className="flex items-center space-x-2 flex-grow min-w-0">
            {issueDetails.parent_issue_id && issueDetails.parent_issue_key && issueDetails.parent_issue_title && (
              <>
                <span className="font-semibold text-gray-600 flex-shrink-0">{issueDetails.parent_issue_key}</span>
                <span className="text-gray-400 flex-shrink-0">-</span>
                <span className="truncate text-gray-600 flex-shrink-0">{issueDetails.parent_issue_title}</span>
                <span className="text-gray-400 flex-shrink-0">/</span>
              </>
            )}
            <span className="text-2xl flex-shrink-0">{issueTypeIconText}</span> {/* Icon for the current issue */}
            <span className="font-semibold text-gray-700 flex-shrink-0">{issueDetails.project?.project_key}-{issueDetails.issue_number}</span>
            <h2 className="text-xl font-bold text-gray-900 ml-2 truncate min-w-0">{issueDetails.title}</h2>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getPriorityColor(issueDetails.priority)}`}>
              {issueDetails.priority}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-grow overflow-hidden">
          {/* Left Column (Main Content) */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Description Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Description</h3>
                {!isEditingDescription && (
                  <button
                    onClick={() => setIsEditingDescription(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>
              {isEditingDescription ? (
                <div className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm">
                  <textarea
                    className="w-full resize-y min-h-[150px] border-none focus:ring-0 focus:outline-none text-gray-800 leading-relaxed"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Add a detailed description..."
                    autoFocus
                  ></textarea>
                  <div className="flex justify-end space-x-3 mt-3">
                    <button
                      onClick={handleCancelDescriptionEdit}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="prose max-w-none bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[100px] text-gray-700 hover:bg-gray-100 transition-colors cursor-text"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {issueDetails.description ? (
                    <div dangerouslySetInnerHTML={{ __html: issueDetails.description.replace(/\n/g, '<br />') }} />
                  ) : (
                    <p className="text-gray-400 italic">Add a description...</p>
                  )}
                </div>
              )}
            </div>

            {/* Sub-Issues Section (only for Epics) */}
            {isCurrentIssueEpic && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Sub-Sories</h3>
                  <span className="text-sm text-gray-500">{subIssues.length} items</span>
                </div>
                {loadingSubIssues ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : subIssues.length > 0 ? (
                  <div className="space-y-2">
                    {subIssues.map(subIssue => (
                      <div
                        key={subIssue.issue_id}
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-xs border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <span className="text-xl flex-shrink-0">{getIssueTypeIcon(subIssue.issue_type_name)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{subIssue.issue_key} - {subIssue.title}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(subIssue.priority)} text-white`}>
                              {subIssue.priority}
                            </span>
                            <span className="text-xs text-gray-500">Status: {subIssue.current_status_name}</span>
                          </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-gray-500">No sub-issues assigned to this Epic yet.</p>
                    <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      + Create Sub-Issue
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Child Issues Section (only for Stories) */}
{issueDetails.issueType?.type_name.toLowerCase() === 'story' && (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-semibold text-gray-800">Child Issues (Bugs/Tasks)</h3>
      <span className="text-sm text-gray-500">{subIssues.length} items</span>
    </div>
    {loadingSubIssues ? (
      <div className="flex justify-center py-4">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    ) : subIssues.length > 0 ? (
      <div className="space-y-2">
        {subIssues.map(subIssue => (
          <div
            key={subIssue.issue_id}
            className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-xs border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <span className="text-xl flex-shrink-0">{getIssueTypeIcon(subIssue.issueType.type_name)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{subIssue.issue_key} - {subIssue.title}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(subIssue.priority)} text-white`}>
                  {subIssue.priority}
                </span>
                <span className="text-xs text-gray-500">Status: {subIssue.currentStatus.status_name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-500">No Bugs/Tasks linked to this Story yet.</p>
      </div>
    )}
  </div>
)}

            {/* Activity Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Activity</h3>
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'comments' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Comments
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'history' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    History
                  </button>
                  {/* Time Tracking Tab Button */}
                  <button
                    onClick={() => setActiveTab('time-tracking')}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'time-tracking' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    Time Tracking
                  </button>
                </div>
              </div>

              {/* Conditional Content based on activeTab */}
              {activeTab === 'comments' && (
                <>
                  <div className="mb-6 bg-white border border-gray-300 rounded-lg p-4 shadow-xs">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {getInitials(issueDetails.reporter?.full_name || 'User')}
                      </div>
                      <div className="flex-1">
                        <textarea
                          className="w-full resize-none border-none focus:ring-0 focus:outline-none text-sm text-gray-800 placeholder-gray-400 min-h-[80px]"
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => setCommentText('')}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddComment}
                            disabled={commentText.trim() === ''}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {paginatedComments.length > 0 ? (
                      paginatedComments.map((log) => (
                        <div key={log.log_id} className="flex items-start space-x-3 bg-white p-4 rounded-lg shadow-xs border border-gray-200">
                          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {getInitials(log.user_name || 'U')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-800">{log.user_name}</p>
                              <p className="text-xs text-gray-400">{formatDateTime(log.created_at)}</p>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{log.comment_text}</p>
                            <div className="flex items-center space-x-3 mt-2">
                              <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                              <button className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="mt-2 text-gray-500">No comments yet. Be the first to add one!</p>
                      </div>
                    )}
                  </div>
                  {renderPaginationControls(commentsCurrentPage, totalCommentsPages, setCommentsCurrentPage)}
                </>
              )}

              {activeTab === 'history' && (
                <>
                  <div className="space-y-4">
                    {paginatedHistory.length > 0 ? (
                      paginatedHistory.map((log) => (
                        <div key={log.log_id} className="flex items-start space-x-3 bg-white p-4 rounded-lg shadow-xs border border-gray-200">
                          <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {getInitials(log.user_name || 'U')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-800">{log.user_name}</p>
                              <p className="text-xs text-gray-400">{formatDateTime(log.created_at)}</p>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                            {log.hours_logged && (
                              <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full inline-flex items-center text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Logged {log.hours_logged} hours
                              </div>
                            )}
                            {log.field_name && (
                              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                Changed <span className="font-medium">{log.field_name}</span> from
                                <span className="line-through text-red-500 mx-1">"{log.old_value}"</span> to
                                <span className="text-green-600 ml-1">"{log.new_value}"</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-gray-500">No activity history found for this issue.</p>
                      </div>
                    )}
                  </div>
                  {renderPaginationControls(historyCurrentPage, totalHistoryPages, setHistoryCurrentPage)}
                </>
              )}

              {activeTab === 'all' && (
                <>
                  <div className="space-y-4">
                    {paginatedAll.length > 0 ? (
                      paginatedAll.map((log) => (
                        <div key={log.log_id} className="flex items-start space-x-3 bg-white p-4 rounded-lg shadow-xs border border-gray-200">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: log.activity_type === 'comment' ? '#6366F1' : '#6B7280' }}>
                            {getInitials(log.user_name || 'U')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-800">{log.user_name}</p>
                              <p className="text-xs text-gray-400">{formatDateTime(log.created_at)}</p>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {log.activity_type === 'comment' ? (
                                <>{log.comment_text}</>
                              ) : (
                                <>{log.description}</>
                              )}
                            </p>
                            {log.activity_type !== 'comment' && (
                              <>
                                {log.hours_logged && (
                                  <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full inline-flex items-center text-xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Logged {log.hours_logged} hours
                                  </div>
                                )}
                                {log.field_name && (
                                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                    Changed <span className="font-medium">{log.field_name}</span> from
                                    <span className="line-through text-red-500 mx-1">"{log.old_value}"</span> to
                                    <span className="text-green-600 ml-1">"{log.new_value}"</span>
                                  </div>
                                )}
                              </>
                            )}
                            {log.activity_type === 'comment' && (
                              <div className="flex items-center space-x-3 mt-2">
                                <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                                <button className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-gray-500">No activity found for this issue.</p>
                      </div>
                    )}
                  </div>
                  {renderPaginationControls(allCurrentPage, totalAllPages, setAllCurrentPage)}
                </>
              )}

              {/* Time Tracking Content (when activeTab is 'time-tracking') */}
              {activeTab === 'time-tracking' && (
                <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700">Time Tracking Summary</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Original Estimate</span>
                        <span className="text-sm text-gray-800">{issueDetails.original_estimate_hours || '0'}h</span>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Time Spent</span>
                        <span className="text-sm text-gray-800">{issueDetails.time_spent || '0'}h</span>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Remaining</span>
                        <span className="text-sm text-gray-800">{issueDetails.remaining_estimate_hours || '0'}h</span>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <button
                        onClick={() => setShowLogTimeForm(!showLogTimeForm)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Log Time</span>
                      </button>
                    </div>
                  </div>

                  {showLogTimeForm && (
                    <form onSubmit={handleLogTime} className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label htmlFor="loggedHours" className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
                          <input
                            type="number"
                            id="loggedHours"
                            value={loggedHours}
                            onChange={(e) => setLoggedHours(e.target.value)}
                            min="0"
                            step="1"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label htmlFor="loggedMinutes" className="block text-xs font-medium text-gray-700 mb-1">Minutes</label>
                          <input
                            type="number"
                            id="loggedMinutes"
                            value={loggedMinutes}
                            onChange={(e) => setLoggedMinutes(e.target.value)}
                            min="0"
                            max="59"
                            step="1"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="logTimeComment" className="block text-xs font-medium text-gray-700 mb-1">Work Description</label>
                        <textarea
                          id="logTimeComment"
                          value={logTimeComment}
                          onChange={(e) => setLogTimeComment(e.target.value)}
                          rows="2"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="What did you work on?"
                        ></textarea>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowLogTimeForm(false)}
                          className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Log Time
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="w-80 flex-shrink-0 p-6 bg-gray-50 border-l border-gray-200 overflow-y-auto">
            {/* Status Section (Static Display) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div
                className="w-full px-3 py-2 rounded-md shadow-sm text-sm font-semibold text-white flex items-center justify-center"
                style={{
                  backgroundColor: issueDetails.currentStatus ? getStatusColorHex(issueDetails.currentStatus.status_name) : '#9CA3AF',
                }}
              >
                {issueDetails.currentStatus?.status_name || 'No Status'}
              </div>
            </div>

            {/* Details Section */}
            <div className="mb-6 bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700">Details</h4>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Assignee</span>
                    {issueDetails.assignee ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                          {assigneeInitials}
                        </div>
                        <span className="text-sm text-gray-800">{issueDetails.assignee.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Unassigned</span>
                    )}
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Reporter</span>
                    {issueDetails.reporter ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                          {reporterInitials}
                        </div>
                        <span className="text-sm text-gray-800">{issueDetails.reporter.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 italic">N/A</span>
                    )}
                  </div>
                </div>
                {issueDetails.parent_issue_id && (
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Parent Issue</span>
                      <span className="text-sm text-gray-800 truncate max-w-[180px]">
                        {issueDetails.parent_issue_key} - {issueDetails.parent_issue_title}
                      </span>
                    </div>
                  </div>
                )}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Project Owner</span>
                    <span className="text-sm text-gray-800">
                      {issueDetails.project?.project_manager_name || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Priority</span>
                    <span className={`px-2 py-0.5 rounded-full text-white text-xs ${getPriorityColor(issueDetails.priority)}`}>
                      {issueDetails.priority}
                    </span>
                  </div>
                </div>
               
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Story Points</span>
                    <span className="text-sm text-gray-800">{issueDetails.story_points || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="mb-6 bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700">Dates</h4>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Created</span>
                    <span className="text-sm text-gray-800">{formatDateTime(issueDetails.created_at)}</span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Updated</span>
                    <span className="text-sm text-gray-800">{formatDateTime(issueDetails.updated_at)}</span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Start Date</span>
                    <span className="text-sm text-gray-800">{formatDate(issueDetails.start_date)}</span>
                  </div>
                </div>
                 <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Due Date</span>
                    <span className="text-sm text-gray-800">{formatDate(issueDetails.due_date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;
