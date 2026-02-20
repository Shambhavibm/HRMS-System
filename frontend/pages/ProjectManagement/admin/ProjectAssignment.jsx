
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Select from "react-select"; 
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Input from "../../../components/form/input/Input";
import Label from "../../../components/form/Label";

const ProjectAssignmentForm = () => {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [nextAssignmentId, setNextAssignmentId] = useState("");
  const [assignedProjectIds, setAssignedProjectIds] = useState([]);

  const [formData, setFormData] = useState({
    project_id: "",
    team_id: "",
    assigned_manager_id: "",
  });

  const [managerName, setManagerName] = useState("");
  const token = localStorage.getItem("token");

 useEffect(() => {
  const fetchData = async () => {
    try {
      const [projectRes, teamRes, userRes, nextIdRes, assignmentsRes] = await Promise.all([
        axios.get("/api/projects", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/teams"),
        axios.get("/api/users"),
        axios.get("/api/project-assignments/next-id", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/project-assignments", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setProjects(projectRes.data);
      setTeams(teamRes.data);
      // setUsers(userRes.data);
      console.log("Fetched users data:", userRes.data);
      const usersArray = Array.isArray(userRes.data) ? userRes.data : userRes.data.users || [];
setUsers(usersArray);

      setNextAssignmentId(nextIdRes.data.nextId);

      // ✅ Use data directly if it's already an array of project_ids
      const assignedIds = assignmentsRes.data.map((id) => Number(id));
      setAssignedProjectIds(assignedIds);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
    }
  };
  fetchData();
}, []);




  const handleTeamSelect = (selectedOption) => {
    const selectedTeamId = selectedOption.value;
    const selectedTeam = teams.find((team) => team.id === selectedTeamId);

    const manager = users.find((u) => u.user_id === selectedTeam.manager_id);
    const fullName = manager ? `${manager.first_name} ${manager.last_name}` : "Unknown";
    setManagerName(fullName);

    setFormData((prev) => ({
      ...prev,
      team_id: selectedTeam.id,
      assigned_manager_id: selectedTeam.manager_id,
    }));
  };

  const handleProjectSelect = (e) => {
  setFormData((prev) => ({
    ...prev,
    project_id: Number(e.target.value),
  }));
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    const assignmentData = {
      assignment_id: nextAssignmentId,
      ...formData,
    };

    try {
      await axios.post("/api/project-assignments", assignmentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Project assigned successfully!");
      setFormData({ project_id: "", team_id: "", assigned_manager_id: "" });
      setManagerName("");
      setNextAssignmentId((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to save assignment:", err);
      toast.error("Failed to assign project. Please try again.");
    }
  };

  const RequiredLabel = ({ htmlFor, children }) => (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-500">*</span>
    </Label>
  );

  const projectOptions = projects.map((proj) => {
  const isAlreadyAssigned = assignedProjectIds.includes(proj.project_id);
  console.log(
    `Checking project ${proj.project_name} (ID: ${proj.project_id}) — assigned: ${isAlreadyAssigned}`
  );

  return {
    value: proj.project_id,
    label: `${proj.project_name}${isAlreadyAssigned ? " (Assigned)" : ""}`,
    isDisabled: isAlreadyAssigned,
  };
});


  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));

  return (
    <>
      <PageMeta title="VipraGo | Assign Project" description="Assign project to team" />
      {/* <PageBreadcrumb pageTitle="Assign Project" /> */}
      <ComponentCard>
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl shadow">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Assignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Assignment ID</Label>
                <Input value={nextAssignmentId} readOnly />
              </div>

              <div>
                <RequiredLabel htmlFor="project_id">Project</RequiredLabel>
                <Select
                  id="project_id"
                   name="project_id"
                  options={projects.map((project) => ({
                  value: project.project_id,
                  label: `${project.project_name}${assignedProjectIds.includes(project.project_id) ? " (Assigned)" : ""}`,
                  isDisabled: assignedProjectIds.includes(project.project_id),
                 }))}
                  value={
                   formData.project_id
                   ? {
                     value: formData.project_id,
                     label:
                      projects.find((p) => p.project_id === formData.project_id)?.project_name || "Unknown",
                      }
                    : null
                  }
                 onChange={(selectedOption) =>
                 setFormData((prev) => ({
                  ...prev,
                  project_id: selectedOption?.value || "",
                   }))
                   }
                  placeholder="Select a project..."
                isSearchable
                />

              </div>

              <div>
                <Label>Project ID</Label>
                <Input value={formData.project_id} readOnly />
              </div>

              <div>
                <RequiredLabel htmlFor="team_id">Team</RequiredLabel>
                <Select
                  id="team_id"
                  name="team_id"
                  options={teamOptions}
                  value={teamOptions.find((option) => option.value === formData.team_id)}
                  onChange={handleTeamSelect}
                  placeholder="Select a team..."
                  isSearchable
                />
              </div>

              <div>
                <Label>Team ID</Label>
                <Input value={formData.team_id} readOnly />
              </div>

              <div>
                <Label>Manager ID</Label>
                <Input value={formData.assigned_manager_id} readOnly />
              </div>

              <div>
                <Label>Manager Name</Label>
                <Input value={managerName} readOnly />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Assign Project</Button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
};

export default ProjectAssignmentForm;
