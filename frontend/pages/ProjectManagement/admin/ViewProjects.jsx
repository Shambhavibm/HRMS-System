
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import PageMeta from "../../../components/common/PageMeta";
import { toast } from "react-toastify";
import EditProject from "./EditProject";
import { Link } from 'react-router-dom';

export default function ViewProjects() {
  const [projectList, setProjectList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("project_name");
  const [isEditing, setIsEditing] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/api/project-assignments/view-projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjectList(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast.error("Failed to fetch projects.");
    }
  };

  const handleCheckProgress = (projectId) => {
    navigate(`/projects/${projectId}/progress`);
  };
  
const handleEdit = (projectId) => {
  console.log('[ProjectList.jsx] Navigating to edit project', projectId);
  navigate(`/admin/edit-project/${projectId}`);
};
  const handleEditComplete = () => {
    setIsEditing(false);
    setEditingProjectId(null);
    fetchProjects();
  };

  const handleDelete = async (projectId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Project deleted successfully!");
      fetchProjects();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete project.");
    }
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

  if (isEditing && editingProjectId) {
    return (
      <EditProject
        projectId={editingProjectId}
        onComplete={handleEditComplete}
      />
    );
  }

  return (
    <>
      <PageMeta
        title="VipraGo | View Projects"
        description="List of all projects with their assigned teams and managers"
      />
      {/* <PageBreadcrumb pageTitle="View Projects" /> */}

      <div className="space-y-6">
        <ComponentCard >
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
  <table className="min-w-full bg-white dark:bg-gray-800">
    <thead className="bg-gray-100 dark:bg-gray-700">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {filteredProjects.length === 0 ? (
        <tr>
          <td colSpan="6" className="text-center py-4 text-gray-500">
            No matching projects found.
          </td>
        </tr>
      ) : (
        filteredProjects.map((project) => (
          <tr key={project.project_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200">
            <td className="px-6 py-4 whitespace-nowrap">{project.project_id}</td>
            <td className="px-6 py-4 whitespace-nowrap">{project.project_name}</td>
            <td className="px-6 py-4 whitespace-nowrap">
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
            <td className="px-6 py-4 whitespace-nowrap">{project.team_name}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <img
                  src={project.manager_image}
                  alt="Manager"
                  className="w-8 h-8 rounded-full object-cover border"
                />
                <span>{project.manager_name}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
              <Link to={`/admin/edit-project/${project.project_id}`}>
                <button className="text-brand-600 hover:text-brand-800">
                  <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                    />
                  </svg>
                </button>
              </Link>
              <button
                onClick={() => handleDelete(project.project_id)}
                className="text-red-600 hover:text-red-800"
              >
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9 3a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h1v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h1a1 1 0 1 0 0-2h-4V4a1 1 0 0 0-1-1H9Zm6 3H9V4h6v2Zm2 2H7v11h10V8Zm-6 2a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0v-6Zm-3 0a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0v-6Zm6 0a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0v-6Z"
                  />
                </svg>
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>

            {filteredProjects.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No matching projects found.
              </p>
            )}
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
