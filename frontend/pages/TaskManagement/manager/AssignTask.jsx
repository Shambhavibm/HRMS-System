// pages/TaskManagement/manager/AssignTask.jsx
import React, { useState, useEffect } from 'react';
import axios from "axios";
import { toast } from "react-toastify";
import Select from "react-select";
import { useLocation, useParams } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

// Import separated components from the same directory
import IssueCard from './IssueCard';
import KanbanColumn from './KanbanColumn';
import AddIssueForm from './AddIssueForm';
import IssueDetailModal from './IssueDetailModal';

// Import utilities from utils.jsx
import {
  API_BASE_URL,
  selectStyles,
  MdSearch,
  MdPersonOutline,
  MdOutlineCategory,
  MdFullscreen,
  MdFullscreenExit,
  MdFolderOpen,
} from './utils.jsx';

const JiraBoard = () => {
  const [statuses, setStatuses] = useState([]);
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]); // New state for client-side filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [boardTitle, setBoardTitle] = useState('Project Board');

  const [showAddIssueForm, setShowAddIssueForm] = useState(false);
  const [statusForNewIssue, setStatusForNewIssue] = useState(null);
  const [prefillDataForForm, setPrefillDataForForm] = useState(null);

  const [showIssueDetailModal, setShowIssueDetailModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);

  const { projectId: rawUrlProjectId } = useParams();
  const urlProjectId = rawUrlProjectId ? parseInt(rawUrlProjectId, 10) : null;

  const location = useLocation();
  const { prefillProjectData } = location.state || {};

  const [user, setUser] = useState({ userId: null, userRole: '', organization_id: null });
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ userId: decoded.userId, userRole: decoded.role, organization_id: decoded.organization_id });
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
    }
  }, []);

  const [filters, setFilters] = useState({
    projectId: prefillProjectData?.project_id || urlProjectId,
    assigneeId: '',
    type: '',
    search: '',
  });

  useEffect(() => {
    const effectiveProjectId = prefillProjectData?.project_id || urlProjectId;
    setFilters(prev => ({ ...prev, projectId: effectiveProjectId }));

    if (prefillProjectData?.project_name) {
      setBoardTitle(`Project: ${prefillProjectData.project_name}`);
      setPrefillDataForForm(prefillProjectData);
    } else if (urlProjectId) {
      const fetchProjectName = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/projects/${urlProjectId}`);
          const projectData = res.data?.data;
          if (projectData && projectData.project_name) {
            setBoardTitle(`Project: ${projectData.project_name}`);
            setPrefillDataForForm({
              project_id: projectData.project_id,
              project_name: projectData.project_name,
              project_key: projectData.project_key,
              team_id: projectData.team_id,
              team_name: projectData.team_name,
              project_manager_id: projectData.project_manager_id,
              project_manager_name: projectData.project_manager_name,
            });
          } else {
            setBoardTitle('Project Board');
          }
        } catch (err) {
          console.error("Failed to fetch project name for board title:", err);
          setBoardTitle('Project Board');
        }
      };
      fetchProjectName();
    } else {
      setBoardTitle('Project Board');
    }
  }, [urlProjectId, prefillProjectData]);


  const [allProjectsOptions, setAllProjectsOptions] = useState([]);
  const [allUsersOptions, setAllUsersOptions] = useState([]);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [issueTypeFilterOptions, setIssueTypeFilterOptions] = useState([]);

  useEffect(() => {
    if (isFullScreen || showAddIssueForm || showIssueDetailModal) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isFullScreen, showAddIssueForm, showIssueDetailModal]);

  useEffect(() => {
    const fetchAndFilterAssignees = async () => {
      const selectedProjectId = filters.projectId;
      if (selectedProjectId) {
        try {
          const projectTeamRes = await axios.get(`${API_BASE_URL}/teams/project/${selectedProjectId}`);
          const teamMembers = projectTeamRes.data?.data || [];
          const memberUserIds = teamMembers.map(member => member.user_id);
          
          const filteredAssignees = allUsersOptions.filter(user => memberUserIds.includes(user.value));
          setAssigneeOptions(filteredAssignees);
        } catch (err) {
          console.error("Failed to fetch project team members:", err);
          setAssigneeOptions(allUsersOptions);
        }
      } else {
        setAssigneeOptions(allUsersOptions);
      }
    };

    if (allUsersOptions.length > 0) {
      fetchAndFilterAssignees();
    }
  }, [filters.projectId, allUsersOptions]);

  // ** Updated: New useEffect for client-side filtering with a null/undefined check for safety **
  useEffect(() => {
    let tempIssues = [...issues];
  
    // 1. Apply Issue Type Filter
    if (filters.type) {
      const typeId = parseInt(filters.type, 10);
      tempIssues = tempIssues.filter(issue => issue.issue_type_id === typeId);
    }
  
    // 2. Apply Search Filter
    if (filters.search) {
      const lowercasedSearch = filters.search.toLowerCase();
      tempIssues = tempIssues.filter(issue =>
        // Safely check if the property exists before calling toLowerCase()
        (issue.issue_title?.toLowerCase().includes(lowercasedSearch)) ||
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


  const loadBoardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusesRes = await axios.get(`${API_BASE_URL}/status-master`);
      setStatuses(Array.isArray(statusesRes.data?.data) ? statusesRes.data.data : []);

      const usersRes = await axios.get(`${API_BASE_URL}/users`);
      const usersList = Array.isArray(usersRes.data)
        ? usersRes.data
        : (Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);
      const mappedUsers = usersList.map(user => ({ value: user.user_id, label: `${user.first_name} ${user.last_name}` }));
      setAllUsersOptions(mappedUsers);

      const issueTypesRes = await axios.get(`${API_BASE_URL}/issue-types`);
      setIssueTypeFilterOptions(Array.isArray(issueTypesRes.data?.data) ? issueTypesRes.data.data.map(type => ({ value: type.issue_type_id, label: type.type_name })) : []);

      const projectsRes = await axios.get(`${API_BASE_URL}/project-assignments/view-projects`);
      let fetchedProjects = Array.isArray(projectsRes.data)
        ? projectsRes.data
        : (Array.isArray(projectsRes.data?.data) ? projectsRes.data.data : []);

      if (user.userRole === "manager") {
        fetchedProjects = fetchedProjects.filter(
          (project) => project.manager_id === user.userId
        );
      } else if (user.userRole === "member") {
        const memberTeamsRes = await axios.get(`${API_BASE_URL}/teams/${user.userId}/memberships`);
        const memberTeamIds = Array.isArray(memberTeamsRes.data?.data)
          ? memberTeamsRes.data.data.map(tm => tm.team_id)
          : [];

        fetchedProjects = fetchedProjects.filter(project => {
          const isDirectlyAssigned = project.assigned_user_ids && project.assigned_user_ids.includes(user.userId);
          const isTeamAssigned = project.team_id && memberTeamIds.includes(project.team_id);
          const projectAssignedToMemberTeam = project.assigned_team_ids && project.assigned_team_ids.some(teamId => memberTeamIds.includes(teamId));
          return isDirectlyAssigned || isTeamAssigned || projectAssignedToMemberTeam;
        });
      }

      const mappedProjectsOptions = fetchedProjects.map(project => ({
        value: project.project_id,
        label: project.project_name,
        team_id: project.team_id,
        team_name: project.team_names,
        managerId: project.manager_id,
        managerName: project.manager_name,
        projectKey: project.project_key,
      }));
      setAllProjectsOptions(mappedProjectsOptions);

      const issueParams = { projectId: filters.projectId };
      const cleanedParams = Object.fromEntries(
        Object.entries(issueParams).filter(([, value]) => value !== '' && value !== null)
      );
      const issuesRes = await axios.get(`${API_BASE_URL}/assign-tasks`, { params: cleanedParams });
      setIssues(Array.isArray(issuesRes.data?.data) ? issuesRes.data.data : []);

    } catch (err) {
      console.error('Failed to load board data:', err.response?.data || err);
      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage = err.response.data?.message || err.response.statusText || `Server error: ${err.response.status}`;
        } else if (err.request) {
          errorMessage = 'Network error: No response from server. Please check if backend is running.';
        } else {
          errorMessage = err.message || 'An unexpected error occurred.';
        }
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      setError(`Failed to load board data: ${errorMessage}`);
      toast.error(`Failed to load board data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.userRole && user.organization_id) {
      loadBoardData();
    }
  }, [filters.projectId, user.userRole, user.organization_id, user.userId]);


  const handleDropIssue = async (issueId, newStatusId) => {
    const originalIssues = [...issues];
    const updatedIssues = issues.map(issue =>
      issue.issue_id === issueId
        ? {
          ...issue,
          current_status_id: newStatusId,
        }
        : issue
    );
    setIssues(updatedIssues);

    try {
      await axios.put(`${API_BASE_URL}/assign-tasks/${issueId}/status`, { newStatusId });
      toast.success("Issue status updated successfully!");
      loadBoardData();
    } catch (err) {
      console.error('Failed to update issue status:', err.response?.data || err);
      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMessage = err.response.data?.message || err.response.statusText || `Server error: ${err.response.status}`;
        } else if (err.request) {
          errorMessage = 'Network error: No response from server. Please check if backend is running.';
        } else {
          errorMessage = err.message || 'An unexpected error occurred.';
        }
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      setError(`Failed to update status: ${errorMessage}`);
      toast.error(`Failed to update status: ${errorMessage}`);
      setIssues(originalIssues);
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

  const handleAddIssueClick = (statusId) => {
    setStatusForNewIssue(statusId);
    setShowAddIssueForm(true);
  };

  const handleCreateIssue = async (newIssueData) => {
    setIssues(prevIssues => [...prevIssues, newIssueData]);
    loadBoardData();
  };

  const handleIssueClick = (issueId) => {
    setSelectedIssueId(issueId);
    setShowIssueDetailModal(true);
  };

  const handleCloseIssueDetailModal = () => {
    setSelectedIssueId(null);
    setShowIssueDetailModal(false);
    loadBoardData();
  };

  const handleDeleteIssue = async (issue) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete issue "${issue.issue_key}"?`
    );

    if (isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/assign-tasks/${issue.issue_id}`);
        toast.success(`Issue "${issue.issue_key}" deleted successfully!`);
        setIssues(prevIssues => prevIssues.filter(i => i.issue_id !== issue.issue_id));
      } catch (err) {
        console.error('Failed to delete issue:', err.response?.data || err);
        let errorMessage = 'Unknown error';
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.message || err.message;
        } else {
          errorMessage = err.message;
        }
        toast.error(`Failed to delete issue: ${errorMessage}`);
      }
    }
  };

  const boardContainerClasses = `
    bg-gradient-to-br from-gray-50 to-blue-50
    font-sans w-full max-w-full flex flex-col
    ${isFullScreen ? 'fixed inset-0 z-[9999] p-4' : 'min-h-screen overflow-y-auto'}
  `;

  const innerBoardContentClasses = `
    flex flex-col flex-grow
    ${isFullScreen ? 'bg-white rounded-xl shadow-2xl overflow-hidden' : ''}
    ${isFullScreen ? 'h-full' : ''}
  `;

  const kanbanColumnsContainerClasses = `
    flex overflow-x-auto py-6 px-4 custom-scrollbar flex-grow
  `;

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 text-lg text-gray-700 animate-pulse">
          Loading board data...
        </div>
      </div>
    );
  if (error)
    return (
      <div className="text-center p-8 text-lg text-red-600 bg-red-50 border border-red-200 rounded-lg m-4">
        Error: {error}
      </div>
    );
  if (!statuses.length)
    return (
      <div className="text-center p-8 text-lg text-gray-500 bg-white rounded-lg shadow-md m-4">
        No statuses configured. Please set up statuses in the admin panel.
        <p className="text-sm mt-2">
          If you're seeing this, ensure your backend's `/api/status-master` endpoint is running and returning an array of status objects.
          Check the browser's console and network tab for more details.
        </p>
      </div>
    );

  return (
    <div className={boardContainerClasses}>
      <div className={innerBoardContentClasses}>
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

        <div className={kanbanColumnsContainerClasses}>
          {statuses.map(status => (
            <KanbanColumn
              key={status.status_id}
              status={status}
              issues={filteredIssues.filter(issue => issue.current_status_id === status.status_id)}
              onDropIssue={handleDropIssue}
              currentProjectId={filters.projectId}
              userId={user.userId}
              userRole={user.userRole}
              onAddIssueClick={handleAddIssueClick}
              onIssueClick={handleIssueClick}
              onDeleteClick={handleDeleteIssue} // Pass the new delete function here
            />
          ))}
        </div>
      </div>

      {showAddIssueForm && (
        <AddIssueForm
          initialStatusId={statusForNewIssue}
          currentProjectId={filters.projectId}
          userId={user.userId}
          organizationId={user.organization_id}
          onClose={() => setShowAddIssueForm(false)}
          onCreateIssue={handleCreateIssue}
          statuses={statuses}
          prefillProjectData={prefillDataForForm}
        />
      )}

      {showIssueDetailModal && selectedIssueId && (
        <IssueDetailModal
          issueId={selectedIssueId}
          onClose={handleCloseIssueDetailModal}
          userId={user.userId}
          organizationId={user.organization_id}
          onIssueUpdated={loadBoardData}
        />
      )}
    </div>
  );
};

export default JiraBoard;
