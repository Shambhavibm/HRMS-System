// pages/TaskManagement/manager/AddIssueForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from "axios";
import { toast } from "react-toastify";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Assuming these utilities are in a file named 'utils.jsx' in the same directory
import {
  API_BASE_URL,
  Label,
  Input,
  TextArea,
  selectStyles,
  parseDate,
  generateIssueKeyPreview,
  MdClose
} from './utils.jsx';

const AddIssueForm = ({ initialStatusId, currentProjectId, userId, organizationId, onClose, onCreateIssue, statuses: propStatuses, prefillProjectData }) => {
  const [issueData, setIssueData] = useState({
    title: '',
    description: '',
    issue_type_id: '',
    parent_issue_id: null,
    project_id: prefillProjectData?.project_id || currentProjectId,
    project_name: prefillProjectData?.project_name || '',
    team_id: prefillProjectData?.team_id || '',
    team_name: prefillProjectData?.team_name || '',
    organization_id: organizationId,
    assignee_id: '',
    reporter_id: prefillProjectData?.project_manager_id || userId,
    current_status_id: initialStatusId,
    priority: 'Medium',
    start_date: null,
    extra_due_date: null,
    actual_start_date: null,
    actual_end_date: null,
    story_points: '',
    time_spent: 0,
    original_estimate_hours: '',
    remaining_estimate_hours: '',
    attachment_url: '',
    remarks: '',
  });

  const [issueTypes, setIssueTypes] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredAssignees, setFilteredAssignees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [epics, setEpics] = useState([]);
  const [epicIssueTypeId, setEpicIssueTypeId] = useState(null);

  const [projectManagerName, setProjectManagerName] = useState(prefillProjectData?.project_manager_name || '');
  const [selectedTeamManagerName, setSelectedTeamManagerName] = useState('');

  const [issueKeyPreview, setIssueKeyPreview] = useState('');
  const [projectKeysMap, setProjectKeysMap] = useState({});

  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [stories, setStories] = useState([]);
  const [selectedParentEpicId, setSelectedParentEpicId] = useState(null);

  // Effect to set initial statuses and fetch all form data
  useEffect(() => {
    setStatuses(propStatuses.map(status => ({ value: status.status_id, label: status.status_name })));

    const fetchFormData = async () => {
      try {
        setLoadingForm(true);
        const [
          issueTypesRes,
          usersRes,
          projectsRes,
          teamsRes,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/issue-types`),
          axios.get(`${API_BASE_URL}/users`),
          axios.get(`${API_BASE_URL}/projects`),
          axios.get(`${API_BASE_URL}/teams`),
        ]);

        const fetchedIssueTypes = Array.isArray(issueTypesRes.data?.data) ? issueTypesRes.data.data : [];
        setIssueTypes(fetchedIssueTypes.map(type => ({ value: type.issue_type_id, label: type.type_name })));

        const epicType = fetchedIssueTypes.find(type => type.type_name.toLowerCase() === 'epic');
        if (epicType) {
          setEpicIssueTypeId(epicType.issue_type_id);
        } else {
          console.warn("Epic issue type not found in database.");
          toast.warn("Epic issue type not found. Parent issue functionality may be limited.");
        }

        const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data : (Array.isArray(usersRes.data?.data) ? usersRes.data.data : []);
        setAllUsers(fetchedUsers.map(user => ({ value: user.user_id, label: `${user.first_name} ${user.last_name}` })));
        setFilteredAssignees(fetchedUsers.map(user => ({ value: user.user_id, label: `${user.first_name} ${user.last_name}` })));

        const fetchedProjects = Array.isArray(projectsRes.data?.data) ? projectsRes.data.data : [];
        const newProjectKeysMap = {};
        const projectOptions = fetchedProjects.map(project => {
          newProjectKeysMap[project.project_id] = project.project_key;
          return {
            value: project.project_id,
            label: project.project_name,
            managerId: project.project_manager_id,
            managerName: project.project_manager_name,
            projectKey: project.project_key
          };
        });
        setProjects(projectOptions);
        setProjectKeysMap(newProjectKeysMap);

        const fetchedTeams = Array.isArray(teamsRes.data?.data) ? teamsRes.data.data : [];
        setTeams(fetchedTeams.map(team => ({
          value: team.team_id,
          label: team.team_name,
          managerId: team.manager_id,
          managerName: team.manager_name,
        })));

        // Prefill logic for project and team
        if (prefillProjectData?.project_id) {
          const selectedProject = fetchedProjects.find(p => p.project_id === prefillProjectData.project_id);
          if (selectedProject?.project_manager_name) {
            setProjectManagerName(selectedProject.project_manager_name);
          }
          setIssueKeyPreview(generateIssueKeyPreview(prefillProjectData.project_id, issueData.title, newProjectKeysMap));
        }

        if (prefillProjectData?.team_id) {
          const selectedTeam = fetchedTeams.find(t => t.team_id === prefillProjectData.team_id);
          if (selectedTeam?.manager_id) {
            setSelectedTeamManagerName(selectedTeam.manager_name); // Set manager name for display
            setIssueData(prev => ({ ...prev, reporter_id: selectedTeam.manager_id }));
          }
          const response = await axios.get(`${API_BASE_URL}/teams/${prefillProjectData.team_id}/users`);
          const teamMembers = Array.isArray(response.data?.data) ? response.data.data.map(member => ({
            value: member.user_id,
            label: member.full_name
          })) : [];
          setFilteredAssignees(teamMembers);
        }
      } catch (err) {
        console.error("Failed to fetch form data:", err);
        let errorMessage = axios.isAxiosError(err) ? (err.response?.data?.message || err.response?.statusText || err.message) : err.message;
        setFormError(`Failed to load form data: ${errorMessage}`);
      } finally {
        setLoadingForm(false);
      }
    };
    fetchFormData();
  }, [currentProjectId, prefillProjectData, propStatuses]);

  // NEW: Effect to handle team selection, filter assignees, and set the reporter
  useEffect(() => {
    const handleTeamSelection = async () => {
      if (issueData.team_id) {
        const selectedTeam = teams.find(team => team.value === issueData.team_id);

        if (selectedTeam && selectedTeam.managerId) {
          // Update state with the team manager's name and ID
          setSelectedTeamManagerName(selectedTeam.managerName);
          setIssueData(prev => ({ ...prev, reporter_id: selectedTeam.managerId }));
        } else {
          setSelectedTeamManagerName(''); // Clear manager name if none found
          setIssueData(prev => ({ ...prev, reporter_id: userId })); // Fallback to current user
        }

        try {
          const response = await axios.get(`${API_BASE_URL}/teams/${issueData.team_id}/users`);
          const teamMembers = Array.isArray(response.data?.data) ? response.data.data.map(member => ({
            value: member.user_id,
            label: member.full_name
          })) : [];
          setFilteredAssignees(teamMembers);
        } catch (err) {
          console.error("Failed to fetch team members:", err);
          setFilteredAssignees([]);
        }
      } else {
        setFilteredAssignees(allUsers); // If no team selected, all users are potential assignees
        setSelectedTeamManagerName('');
        setIssueData(prev => ({ ...prev, reporter_id: userId })); // Reset reporter to current user
      }
    };
    if (teams.length > 0 || issueData.team_id === '') {
      handleTeamSelection();
    }
  }, [issueData.team_id, teams, allUsers, userId]);

useEffect(() => {
  const fetchStories = async () => {
    if (selectedParentEpicId) {  // <-- Use selectedParentEpicId here!
      try {
        const response = await axios.get(`${API_BASE_URL}/assign-tasks/sub-issues/${selectedParentEpicId}`);
        if (response.data.success) {
          setStories(response.data.data.filter(issue => issue.issueType && issue.issueType.type_name === 'Story'));
        }
      } catch (err) {
        console.error("Failed to fetch Stories:", err);
        setStories([]);
      }
    } else {
      setStories([]); // Reset stories if no Epic selected
    }
  };
  fetchStories();
}, [selectedParentEpicId]); // <-- Dependency changed!

  // Effect to update project manager name and issue key preview
  useEffect(() => {
    const selectedProject = projects.find(p => p.value === issueData.project_id);
    if (selectedProject && selectedProject.managerName) {
      setProjectManagerName(selectedProject.managerName);
    } else {
      setProjectManagerName('');
    }
    setIssueKeyPreview(generateIssueKeyPreview(issueData.project_id, issueData.title, projectKeysMap));
  }, [issueData.project_id, projects, issueData.title, projectKeysMap]);

  // Effect to fetch Epics
  useEffect(() => {
    const fetchEpics = async () => {
      if (issueData.project_id && epicIssueTypeId) {
        try {
          const response = await axios.get(`${API_BASE_URL}/epics/${issueData.project_id}`);
          setEpics(Array.isArray(response.data?.data) ? response.data.data.map(epic => ({
            value: epic.issue_id,
            label: `${epic.issue_key} - ${epic.title}`
          })) : []);
        } catch (err) {
          console.error("Failed to fetch epics:", err.response?.data || err);
          toast.error(`Failed to load Epics: ${err.response?.data?.message || err.message || 'Server error'}`);
          setEpics([]);
        }
      } else {
        setEpics([]);
      }
    };
    fetchEpics();
  }, [issueData.project_id, epicIssueTypeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIssueData(prev => ({
      ...prev,
      [name]: (name === 'story_points' || name === 'time_spent' || name === 'original_estimate_hours' || name === 'remaining_estimate_hours') && value !== ''
        ? parseFloat(value)
        : value,
    }));

    if (name === 'title') {
      setIssueKeyPreview(generateIssueKeyPreview(issueData.project_id, value, projectKeysMap));
    }
  };

  const handleSelectChange = (selectedOption, { name }) => {
    setIssueData(prev => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : '',
      ...(name === 'project_id' && selectedOption ? { project_name: selectedOption.label } : {}),
      ...(name === 'team_id' && selectedOption ? { team_name: selectedOption.label } : {}),
      ...(name === 'issue_type_id' && selectedOption && selectedOption.value === epicIssueTypeId
        ? { parent_issue_id: null }
        : {}),
    }));

    if (name === 'project_id') {
      const newProjectId = selectedOption ? selectedOption.value : '';
      setIssueKeyPreview(generateIssueKeyPreview(newProjectId, issueData.title, projectKeysMap));
    }
  };

  const handleDateChange = (date, name) => {
    setIssueData(prev => ({ ...prev, [name]: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const submissionData = { ...issueData };
    for (const key of ['start_date', 'extra_due_date', 'actual_start_date', 'actual_end_date']) {
      if (submissionData[key] instanceof Date && !isNaN(submissionData[key].getTime())) {
        submissionData[key] = submissionData[key].toISOString().split('T')[0];
      } else {
        submissionData[key] = null;
      }
    }
    submissionData.due_date = submissionData.extra_due_date;
    delete submissionData.extra_due_date;
    delete submissionData.project_name;
    delete submissionData.team_name;

    if (submissionData.issue_type_id === epicIssueTypeId) {
        submissionData.parent_issue_id = null;
    }

    if (!submissionData.title || !submissionData.issue_type_id || !submissionData.current_status_id || !submissionData.project_id) {
      setFormError("Please fill in all required fields (Title, Type, Status, Project).");
      toast.error("Please fill in all required fields (Title, Type, Status, Project).");
      setSubmitting(false);
      return;
    }

    if (!submissionData.team_id && !submissionData.assignee_id) {
      setFormError("Please assign the task to an individual or a team.");
      toast.error("Please assign the task to an individual or a team.");
      setSubmitting(false);
      return;
    }

    setFormError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/assign-tasks`, submissionData);
      onCreateIssue(response.data.data);
      toast.success("Issue created successfully!");
      onClose();
    } catch (err) {
      console.error("Error creating issue:", err.response?.data || err);
      setFormError(`Failed to create issue: ${err.response?.data?.message || err.message || 'Unknown error'}`);
      toast.error(`Failed to create issue: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: 'Highest', label: 'Highest' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
    { value: 'Lowest', label: 'Lowest' },
  ];

  const modalClasses = `fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in`;
  const contentClasses = `bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[80vh] overflow-y-auto flex flex-col transform scale-95 animate-scale-in`;

  if (loadingForm) return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-center text-lg text-gray-700 animate-pulse">Loading form data...</div>
    </div>
  );
  if (formError) return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white p-8 rounded-xl shadow-2xl text-red-600 text-center text-lg">
        <p>Error: {formError}</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Close</button>
      </div>
    </div>
  );

  const isEpicIssueType = issueData.issue_type_id === epicIssueTypeId;

  // Determine if the reporter field should be a static display
  const isReporterFixed = !!issueData.team_id || !!prefillProjectData?.project_manager_id;
  const reporterManagerDisplay = issueData.team_id
    ? selectedTeamManagerName
    : projectManagerName;

  return (
    <div className={modalClasses}>
      <div className={contentClasses}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-800">Create New Issue</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <MdClose size={28} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-grow">
          {formError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded-md border border-red-200">{formError}</p>}

          {/* Issue Information */}
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Issue Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                <Input
                  name="title"
                  value={issueData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Implement User Login"
                />
              </div>
              <div>
                <Label htmlFor="issue_key_preview">Issue Key</Label>
                <Input
                  id="issue_key_preview"
                  name="issue_key_preview"
                  value={issueKeyPreview || "Auto-generated"}
                  disabled
                  placeholder="Auto-generated after creation"
                />
              </div>
              <div>
                <Label htmlFor="issue_type_id">Issue Type <span className="text-red-500">*</span></Label>
                <Select
                  name="issue_type_id"
                  options={issueTypes}
                  value={issueTypes.find(opt => opt.value === issueData.issue_type_id) || null}
                  onChange={handleSelectChange}
                  styles={selectStyles}
                  placeholder="Select Type"
                  required
                />
              </div>
              {!isEpicIssueType && (
                <div>
                  <Label htmlFor="parent_issue_id">Parent Epic</Label>
                  <Select
  name="parent_issue_id"
  options={epics}
  value={epics.find(opt => opt.value === issueData.parent_issue_id) || null}
  onChange={(selectedOption) => {
    const epicId = selectedOption ? selectedOption.value : null;
    setSelectedParentEpicId(epicId); // <-- Correct Epic ID for Story fetching
    setIssueData(prev => ({ ...prev, parent_issue_id: epicId })); // <-- Link Epic in form state
  }}
  styles={selectStyles}
  placeholder="Select Parent Epic (Optional)"
  isClearable
/>

                </div>
              )}
              {!isEpicIssueType && (issueTypes.find(type => type.value === issueData.issue_type_id)?.label === 'Bug' || issueTypes.find(type => type.value === issueData.issue_type_id)?.label === 'Task') && (
  <div>
    <Label htmlFor="parent_story_id">Parent Story <span className="text-red-500">*</span></Label>
    <Select
  name="parent_issue_id"
  options={stories.map(story => ({ value: story.issue_id, label: `${story.issue_key} - ${story.title}` }))}
  value={stories.find(story => story.issue_id === issueData.parent_issue_id) 
            ? { value: issueData.parent_issue_id, label: `${stories.find(story => story.issue_id === issueData.parent_issue_id).issue_key} - ${stories.find(story => story.issue_id === issueData.parent_issue_id).title}` }
            : null}
  onChange={(selectedOption) => setIssueData(prev => ({ ...prev, parent_issue_id: selectedOption ? selectedOption.value : null }))}
  styles={selectStyles}
  placeholder="Select Parent Story"
  isClearable
/>

  </div>
)}

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <TextArea
                  name="description"
                  value={issueData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Detailed description of the issue or task..."
                />
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Assignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="project_id">Project <span className="text-red-500">*</span></Label>
                <Select
                  name="project_id"
                  options={projects}
                  value={
                    issueData.project_id && issueData.project_name
                      ? { value: issueData.project_id, label: issueData.project_name }
                      : projects.find(opt => opt.value === issueData.project_id) || null
                  }
                  onChange={handleSelectChange}
                  styles={selectStyles}
                  placeholder="Select Project"
                  required
                  isDisabled={!!prefillProjectData?.project_id}
                />
                {projectManagerName && (
                  <p className="text-xs text-gray-500 mt-1">Project Manager: {projectManagerName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="team_id">Team</Label>
                <Select
                  name="team_id"
                  options={teams}
                  value={
                    issueData.team_id && issueData.team_name
                      ? { value: issueData.team_id, label: issueData.team_name }
                      : teams.find(opt => opt.value === issueData.team_id) || null
                  }
                  onChange={handleSelectChange}
                  styles={selectStyles}
                  placeholder="Select Team"
                  isClearable
                  isDisabled={!!prefillProjectData?.team_id}
                />
              </div>
              <div>
                <Label htmlFor="assignee_id">Assignee {(!issueData.team_id) && <span className="text-red-500">*</span>}</Label>
                <Select
                  name="assignee_id"
                  options={filteredAssignees}
                  value={filteredAssignees.find(opt => opt.value === issueData.assignee_id) || null}
                  onChange={handleSelectChange}
                  styles={selectStyles}
                  placeholder="Select Assignee (Optional if Team is selected)"
                  isClearable
                />
              </div>
              <div>
                <Label htmlFor="reporter_id">Reporter</Label>
                {/* Conditionally render either the static manager name or the selectable dropdown */}
                {isReporterFixed ? (
                  <div className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4  text-gray-700 text-sm">
                    <strong>{reporterManagerDisplay}</strong>
                  </div>
                ) : (
                  <Select
                    name="reporter_id"
                    options={allUsers}
                    value={allUsers.find(opt => opt.value === issueData.reporter_id) || null}
                    onChange={handleSelectChange}
                    styles={selectStyles}
                    placeholder="Select Reporter"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Status & Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="current_status_id">Status <span className="text-red-500">*</span></Label>
                <Select
                  name="current_status_id"
                  options={statuses}
                  value={statuses.find(opt => opt.value === issueData.current_status_id) || null}
                  onChange={handleSelectChange}
                  styles={selectStyles}
                  placeholder="Select Status"
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  name="priority"
                  options={priorityOptions}
                  value={priorityOptions.find(opt => opt.value === issueData.priority) || null}
                  onChange={handleSelectChange}
                  styles={selectStyles}
                  placeholder="Select Priority"
                />
              </div>
            </div>
          </div>

          {/* Timeline & Effort */}
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Timeline & Effort</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <DatePicker
                  selected={parseDate(issueData.start_date)}
                  onChange={(date) => handleDateChange(date, "start_date")}
                  dateFormat="yyyy-MM-dd"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm"
                  placeholderText="Select Start Date"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <Label htmlFor="extra_due_date">Due Date</Label>
                <DatePicker
                  selected={parseDate(issueData.extra_due_date)}
                  onChange={(date) => handleDateChange(date, "extra_due_date")}
                  dateFormat="yyyy-MM-dd"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm"
                  placeholderText="Select Due Date"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <Label htmlFor="actual_start_date">Actual Start Date</Label>
                <DatePicker
                  selected={parseDate(issueData.actual_start_date)}
                  onChange={(date) => handleDateChange(date, "actual_start_date")}
                  dateFormat="yyyy-MM-dd"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm"
                  placeholderText="Select Actual Start Date"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <Label htmlFor="actual_end_date">Actual End Date</Label>
                <DatePicker
                  selected={parseDate(issueData.actual_end_date)}
                  onChange={(date) => handleDateChange(date, "actual_end_date")}
                  dateFormat="yyyy-MM-dd"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-sm"
                  placeholderText="Select Actual End Date"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <Label htmlFor="story_points">Story Points</Label>
                <Input
                  type="number"
                  name="story_points"
                  value={issueData.story_points}
                  onChange={handleChange}
                  min="0"
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <Label htmlFor="original_estimate_hours">Original Estimate (hours)</Label>
                <Input
                  type="number"
                  name="original_estimate_hours"
                  value={issueData.original_estimate_hours}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  placeholder="e.g., 8.0"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium mb-4 text-gray-700">Additional Details</h3>
            <div className="space-y-5">
              <div>
                <Label htmlFor="attachment_url">Attachment URL</Label>
                <Input
                  type="url"
                  name="attachment_url"
                  value={issueData.attachment_url}
                  onChange={handleChange}
                  placeholder="e.g., https://example.com/document.pdf"
                />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <TextArea
                  name="remarks"
                  value={issueData.remarks}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Any additional notes or comments..."
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-200 shadow-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 shadow-md hover:shadow-lg"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIssueForm;