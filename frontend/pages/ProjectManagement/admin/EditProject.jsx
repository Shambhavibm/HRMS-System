

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/Input";
import Label from "../../../components/form/Label";

const EditProject = () => {
  const { projectId } = useParams();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    project_id: "",
    project_name: "",
    description: "",
    discussion_date: null,
    start_date: null,
    implemented_date: null,
    ongoing_status_date: null,
    end_date: null,
    status: "",
    budget: "",
    client_name: "",
    stakeholder_1: "",
    stakeholder_2: "",
    phone_number:"",
    email:"",
    website:"",
    client_address: "",
    state: "",
    city:"",
    country: "",
    zipcode: "",
  });

  const [assignmentData, setAssignmentData] = useState({
    assignment_id: "",
    team_id: "",
    assigned_manager_id: "",
  });

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [managerName, setManagerName] = useState("");

  const [loading, setLoading] = useState(true);
  const [dataFetchError, setDataFetchError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setDataFetchError(null);

      if (!projectId) {
        toast.error("Invalid project ID. Cannot fetch data.");
        setLoading(false);
        return;
      }
      if (!token) {
        toast.error("Authentication token missing. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const [projectRes, teamRes, userRes] = await Promise.all([
          axios.get(`/api/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/admin/teams", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // --- NEW HELPER FUNCTION TO SAFELY PARSE DATES ---
        const parseDate = (dateString) => {
          if (!dateString) { // Handles null, undefined, and empty string
            return null;
          }
          const date = new Date(dateString);
          // Check if the date is actually valid (e.g., handles "0000-00-00" which creates an Invalid Date)
          return isNaN(date.getTime()) ? null : date;
        };
        // --- END NEW HELPER FUNCTION ---

        const fetchedProjectData = projectRes.data;
        setFormData({
          ...fetchedProjectData,
          discussion_date: parseDate(fetchedProjectData.discussion_date),
          start_date: parseDate(fetchedProjectData.start_date),
          implemented_date: parseDate(fetchedProjectData.implemented_date),
          ongoing_status_date: parseDate(fetchedProjectData.ongoing_status_date),
          end_date: parseDate(fetchedProjectData.end_date),
        });

        // setTeams(teamRes.data);
        // setUsers(userRes.data);
        setUsers(userRes.data.users); // if response structure is { data: [...] }
        setTeams(teamRes.data);

        try {
          const assignmentRes = await axios.get(`/api/project-assignments/by-project/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const { team_id, assigned_manager_id } = assignmentRes.data;
          setAssignmentData({ ...assignmentRes.data });

          const manager = userRes.data.users.find((u) => u.user_id === assigned_manager_id);
          setManagerName(manager ? `${manager.first_name} ${manager.last_name}` : "Unknown");

        } catch (assignmentError) {
          if (assignmentError.response && assignmentError.response.status === 404) {
            // Do NOT show a toast.error for 404, as it's a valid "empty" state.
            setAssignmentData({
              assignment_id: "",
              team_id: "",
              assigned_manager_id: "",
            });
            setManagerName(""); // Clear manager name if no assignment
          } else {
            console.error("Failed to load assignment data:", assignmentError);
            toast.error("Failed to load assignment data.");
            setDataFetchError("Failed to load assignment data.");
          }
        }
      } catch (error) {
        console.error('Failed to load project or related data:', error);
        toast.error("Failed to load project or related data. See console for details.");
        setDataFetchError("Failed to load project or related data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, name) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleTeamSelect = (selectedOption) => {
    // If selectedOption is null (when clearing the selection)
    if (!selectedOption) {
      setAssignmentData({
        assignment_id: assignmentData.assignment_id, // Keep existing ID if it's there for potential delete
        team_id: null,
        assigned_manager_id: null,
      });
      setManagerName("");
      return;
    }

    const selectedTeam = teams.find((t) => t.id === selectedOption.value);
    const manager = users.find((u) => u.user_id === selectedTeam?.manager_id);
    setAssignmentData({
      ...assignmentData,
      team_id: selectedTeam?.id || null,
      assigned_manager_id: selectedTeam?.manager_id || null,
    });

    setManagerName(manager ? `${manager.first_name} ${manager.last_name}` : "Unknown");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedFormData = { ...formData };
    for (const key of ['discussion_date', 'start_date', 'implemented_date', 'ongoing_status_date', 'end_date']) {
      if (formattedFormData[key] instanceof Date) {
        formattedFormData[key] = formattedFormData[key].toISOString().split('T')[0];
      } else {
        // Ensure non-Date values are sent as null or empty string, not "Invalid Date" string
        formattedFormData[key] = null; // Send null to backend if date is not selected
      }
    }
    try {
      await axios.put(`/api/projects/${projectId}`, formattedFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update or Create Project Assignment
      if (assignmentData.team_id && assignmentData.assigned_manager_id) { // Ensure both are present for an assignment
        if (assignmentData.assignment_id) {
          // If assignment_id exists, it means we're updating an existing assignment
          await axios.put(`/api/project-assignments/${assignmentData.assignment_id}`, assignmentData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          // If no assignment_id but a team_id is selected, create a new assignment
          await axios.post(`/api/project-assignments`, {
            project_id: projectId,
            team_id: assignmentData.team_id,
            assigned_manager_id: assignmentData.assigned_manager_id,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } else if (assignmentData.assignment_id) {
          // If a project had an assignment, but the team/manager was now unselected, delete the assignment
          await axios.delete(`/api/project-assignments/${assignmentData.assignment_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.info("Project assignment removed.");
      }
      toast.success("Project updated successfully.");
    } catch (err) {
      console.error("Failed to update project:", err);
      toast.error("Failed to update project.");
    }
  };

  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));

  // Render loading and error states
  if (loading) {
    return (
      <>
        <PageMeta title="VipraGo | Edit Project" description="Edit existing project" />
        <PageBreadcrumb pageTitle="Edit Project" />
        <ComponentCard>
          <div className="text-center py-10 text-lg text-gray-600 dark:text-gray-400">Loading project details...</div>
        </ComponentCard>
      </>
    );
  }

  if (dataFetchError) {
    return (
      <>
        <PageMeta title="VipraGo | Edit Project" description="Edit existing project" />
        <PageBreadcrumb pageTitle="Edit Project" />
        <ComponentCard>
          <div className="text-center py-10 text-lg text-red-600 dark:text-red-400">
            {dataFetchError}
            <br />
            Please try refreshing the page or check your network connection.
          </div>
        </ComponentCard>
      </>
    );
  }

  return (
    <>
      <PageMeta title="VipraGo | Edit Project" description="Edit existing project" />
      <PageBreadcrumb pageTitle="Edit Project" />
      <ComponentCard>
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Project Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Project Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Project ID</Label><Input name="project_id" value={formData.project_id || ""} readOnly /></div>
              <div><Label>Project Name</Label><Input name="project_name" value={formData.project_name || ""} onChange={handleChange} /></div>
              <div><Label>Description</Label><Input name="description" value={formData.description || ""} onChange={handleChange} /></div>

              {/* Date Pickers */}
              <div>
                <Label>Discussion Date</Label>
                <DatePicker
                  selected={formData.discussion_date}
                  onChange={(date) => handleDateChange(date, "discussion_date")}
                  dateFormat="dd-MM-yyyy"
                  className="form-input border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholderText="Select Discussion Date"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <DatePicker
                  selected={formData.start_date}
                  onChange={(date) => handleDateChange(date, "start_date")}
                  dateFormat="dd-MM-yyyy"
                  className="form-input border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholderText="Select Start Date"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div>
                <Label>Implemented Date</Label>
                <DatePicker
                  selected={formData.implemented_date}
                  onChange={(date) => handleDateChange(date, "implemented_date")}
                  dateFormat="dd-MM-yyyy"
                  className="form-input border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholderText="Select Implemented Date"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div>
                <Label>Ongoing Status Date</Label>
                <DatePicker
                  selected={formData.ongoing_status_date}
                  onChange={(date) => handleDateChange(date, "ongoing_status_date")}
                  dateFormat="dd-MM-yyyy"
                  className="form-input border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholderText="Select Ongoing Status Date"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <DatePicker
                  selected={formData.end_date}
                  onChange={(date) => handleDateChange(date, "end_date")}
                  dateFormat="dd-MM-yyyy"
                  className="form-input border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholderText="Select End Date"
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                />
              </div>

              <div><Label>Status</Label><Input name="status" value={formData.status || ""} onChange={handleChange} /></div>
              <div><Label>Budget</Label><Input name="budget" value={formData.budget || ""} onChange={handleChange} /></div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Client Name</Label><Input name="client_name" value={formData.client_name || ""} onChange={handleChange} /></div>
              <div><Label>Primary Stakeholder Name</Label><Input name="stakeholder_1" value={formData.stakeholder_1 || ""} onChange={handleChange} /></div>
              <div><Label>Secondary Stakeholder Name</Label><Input name="stakeholder_2" value={formData.stakeholder_2 || ""} onChange={handleChange} /></div>
              <div><Label>Phone Number</Label><Input name="phone_number" value={formData.phone_number || ""} onChange={handleChange} /></div>
              <div><Label>email</Label><Input name="email" value={formData.email || ""} onChange={handleChange} /></div>
              <div><Label>Website Link</Label><Input name="website" value={formData.website || ""} onChange={handleChange} /></div>
              <div><Label>Address </Label><Input name="client_address" value={formData.client_address || ""} onChange={handleChange} /></div>
              <div><Label>city</Label><Input name="city" value={formData.city || ""} onChange={handleChange} /></div>
              <div><Label>State</Label><Input name="state" value={formData.state || ""} onChange={handleChange} /></div>
              <div><Label>Country</Label><Input name="country" value={formData.country || ""} onChange={handleChange} /></div>
              <div><Label>ZIP Code</Label><Input name="zipcode" value={formData.zipcode || ""} onChange={handleChange} /></div>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Assignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Team</Label>
                <Select
                  options={teamOptions}
                  value={teamOptions.find((opt) => opt.value === assignmentData.team_id) || null}
                  onChange={handleTeamSelect}
                  placeholder="Select a team..."
                  isClearable // Allows clearing the selected team
                />
              </div>
              <div><Label>Team ID</Label><Input value={assignmentData.team_id || ""} readOnly /></div>
              <div><Label>Manager ID</Label><Input value={assignmentData.assigned_manager_id || ""} readOnly /></div>
              <div><Label>Manager Name</Label><Input value={managerName || ""} readOnly /></div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit">Update Project</Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
};

export default EditProject;