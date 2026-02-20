// pages/TaskManagement/manager/IssueCard.jsx
import React from 'react';
import {
  getIssueTypeIcon,
  getPriorityColor,
  getInitials,
} from './utils.jsx'; // Import from utils.jsx

// Import the delete icon
import { MdDeleteOutline } from 'react-icons/md';
import { IoTimerOutline } from 'react-icons/io5';
import { MdAccessTime } from 'react-icons/md';

const IssueCard = ({ issue, onIssueClick, onDelete }) => {
  if (!issue) return null;

  const handleDeleteClick = (e) => {
    // Stop the event from bubbling up to the parent div's onClick
    e.stopPropagation();
    // Call the onDelete function passed from the parent component
    // >>> CHANGE: Pass the entire 'issue' object, not just the ID. <<<
    onDelete(issue);
  };

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('issueId', issue.issue_id.toString())}
      onClick={() => onIssueClick(issue.issue_id)} // Make card clickable
      className="bg-white rounded-lg shadow-sm p-4 mb-3 cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-100 transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-800 mr-2">{issue.title}</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDeleteClick}
            className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors duration-200"
            aria-label="Delete Issue"
          >
            <MdDeleteOutline size={18} />
          </button>
          <div className={`flex-shrink-0 text-xs font-medium text-white px-2 py-0.5 rounded-full ${getPriorityColor(issue.priority)}`}>
            {issue.priority}
          </div>
        </div>
      </div>
      {issue.issue_key && (
        <p className="text-xs text-gray-500 mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
          {issue.issue_key}
        </p>
      )}
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

export default IssueCard;
