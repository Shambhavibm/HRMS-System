import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import { toast } from "react-toastify";

// Reusing EditProject from admin
import EditProject from "../../ProjectManagement/admin/EditProject";

// Importing ManagerTeamView (assuming this is correct path)
// import ManagerTeamView from "../../TeamsManagement/manager/ManagerTeamView"; // Uncomment if still used

export default function ViewProjects() {
  const [projectList, setProjectList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("project_name");
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [user, setUser] = useState({ role: "", userId: null });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUser({ role: decoded.role, userId: decoded.userId });
      fetchProjects(decoded.role, decoded.userId);
    }
  }, []);

  const fetchProjects = async (role, userId) => {
    try {
      const res = await axios.get("/api/project-assignments/view-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let projects = res.data;

      if (role === "manager") {
        projects = projects.filter(
          (project) => project.manager_id === userId
        );
      }

      console.log("🧪 Raw project data:", projects);

      setProjectList(projects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast.error("Failed to fetch projects.");
    }
  };

  const handleCheckProgress = (projectId) => {
    navigate(`/projects/${projectId}/progress`);
  };

  const handleEdit = (projectId) => {
    setIsEditing(true);
    setEditingProjectId(projectId);
  };

  const handleEditComplete = () => {
    setIsEditing(false);
    setEditingProjectId(null);
    fetchProjects(user.role, user.userId);
  };

  // --- MODIFIED: handleAssignTask function to use the correct route with projectId param ---
  const handleAssignTask = (project) => {
    // Navigate to the AssignTask page, including projectId in the URL path
    // and passing additional project data in the state object.
    navigate(`/manager/myproject/${project.project_id}/assigntask`, {
      state: {
        prefillProjectData: {
          project_id: project.project_id,
          project_name: project.project_name,
          team_id: project.team_id,
          team_name: project.team_name,
          project_manager_id: project.manager_id,
          project_manager_name: project.manager_name,
        },
      },
    });
  };

  const filteredProjects = projectList.filter((project) => {
    const query = searchQuery.toLowerCase();
    switch (filterType) {
      case "project_id":
        return project.project_id.toString().includes(query);
      case "project_name":
        return project.project_name.toLowerCase().includes(query);
      case "status":
        return project.status.toLowerCase().includes(query);
      case "team_name":
        return project.team_name.toLowerCase().includes(query);
      case "manager_name":
        return project.manager_name.toLowerCase().includes(query);
      default:
        return true;
    }
  });

  // Render EditProject if editing
  if (isEditing && editingProjectId) {
    return (
      <EditProject
        projectId={editingProjectId}
        onComplete={handleEditComplete}
      />
    );
  }

  console.log("🧪 Project List:", projectList);

  // Main Projects Table View
  return (
    <>
      <PageMeta
        title="VipraGo | View Projects"
        description="List of all projects with their assigned teams and managers"
      />
      <PageBreadcrumb pageTitle="View Projects" />

      <div className="space-y-6">
        <ComponentCard title="Projects Overview">
          <div className="flex items-center w-full gap-4 mb-4">
            <div className="w-1/4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="project_name">Project Name</option>
                <option value="project_id">Project ID</option>
                <option value="status">Status</option>
                <option value="team_name">Team Name</option>
                <option value="manager_name">Manager Name</option>
              </select>
            </div>
            <div className="w-3/4">
              <input
                type="text"
                placeholder={`Search by ${filterType.replace("_", " ")}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full bg-white border border-gray-200 rounded">
              <thead className="bg-gray-100 text-gray-600 text-sm">
                <tr>
                  <th className="px-4 py-2 border">Project ID</th>
                  <th className="px-4 py-2 border">Project Name</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Team Name</th>
                  <th className="px-4 py-2 border">Manager</th>
                  <th className="px-4 py-2 border">Timeline</th>
                  <th className="px-4 py-2 border">Tasks</th> {/* This column will now have the button */}
                  <th className="px-4 py-2 border text-center">Progress</th>
                  <th className="px-4 py-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr key={project.project_id} className="text-sm text-gray-700 hover:bg-gray-50">
                      <td className="px-4 py-2 border">{project.project_id}</td>
                      <td className="px-4 py-2 border">{project.project_name}</td>
                      <td className="px-4 py-2 border">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            project.status.toLowerCase() === "planned"
                              ? "bg-yellow-100 text-yellow-800"
                              : project.status.toLowerCase() === "active"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 border">
                        <Link
                          to={`/manager/my-team/${project.team_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {project.team_name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 border">
                        <div className="flex items-center gap-2">
                          <img
                            src={project.manager_image}
                            alt="Manager"
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <span>{project.manager_name}</span>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-4 py-2 border text-sm leading-tight">
                        <div>
                          <span className="text-gray-600 font-medium">Start:</span>{" "}
                          {project.start_date?.slice(0, 10) || "N/A"}
                        </div>
                        <div>
                          <span className="text-gray-600 font-medium">End:</span>{" "}
                          {project.end_date?.slice(0, 10) || "N/A"}
                        </div>
                      </td>

                      {/* Tasks column with Assign Task button */}
                      <td className="px-4 py-2 border">
                        <button
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                          onClick={() => handleAssignTask(project)} // Pass the entire project object
                        >
                          Assign Task
                        </button>
                      </td>
                      <td className="px-4 py-2 border text-center">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
                          onClick={() => handleCheckProgress(project.project_id)}
                        >
                          Check Progress
                        </button>
                      </td>
                      <td className="px-4 py-2 border text-center">
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          onClick={() => handleEdit(project.project_id)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-gray-500">
                      No matching projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
