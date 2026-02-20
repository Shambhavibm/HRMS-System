// pages/TaskManagement/manager/KanbanColumn.jsx
import React from 'react';
import IssueCard from './IssueCard'; // Import IssueCard from same directory
import { sortIssuesByPriority, MdAdd } from './utils.jsx'; // Import from utils.jsx

const KanbanColumn = ({ status, issues, onDropIssue, currentProjectId, userId, userRole, onAddIssueClick, onIssueClick, onDeleteClick }) => {
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

  // Sort issues by priority before rendering
  const sortedIssues = sortIssuesByPriority(issues);

  return (
    <div
      className="bg-gray-50 rounded-xl flex-shrink-0 w-80 p-4 mr-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">{status.status_name} <span className="text-gray-500 font-medium text-base">({issues.length})</span></h3>
        {(userRole === 'admin' || userRole === 'manager') && (
          <button
            onClick={() => onAddIssueClick(status.status_id)}
            className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title={`Add new issue to ${status.status_name}`}
          >
            <MdAdd size={22} />
          </button>
        )}
      </div>
      <div className="min-h-[100px] max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-2">
        {sortedIssues.map(issue => ( // Render sorted issues
          <IssueCard 
            key={issue.issue_id} 
            issue={issue} 
            onIssueClick={onIssueClick} 
            onDelete={onDeleteClick}
          />
        ))}
        {!issues.length && (
          <div className="text-center text-gray-400 text-sm py-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-100">
            No issues here. Drag or add one!
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
