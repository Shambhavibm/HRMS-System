
import React, { useState, useMemo } from 'react';
import Button from '../../../pages/../components/ui/button/Button';

const AdminProjectDetails = ({
  projects,
  role,
  token,
  setSelectedProjectId,
  openCostModal,
  purpleButton,
  ProgressBar
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return projects.filter(project =>
      project.name?.toLowerCase().includes(term) ||
      project.client_name?.toLowerCase().includes(term) ||
      project.status?.toLowerCase().includes(term) ||
      String(project.id).includes(term)
    );
  }, [projects, searchTerm]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Project Details</h2>
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Search by Project name, client or status"
            className="w-full px-4 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProjects.map(project => (
          <div key={project.id} className="border p-4 rounded shadow dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-xl font-semibold dark:text-white">{project.name}</h3>
            <p className="dark:text-gray-300">Customer: {project.client_name}</p>
            <p className="dark:text-gray-300">Status: <strong>{project.status}</strong></p>
            <p className="dark:text-gray-300">Start: {new Date(project.start_date).toLocaleDateString()}</p>
            <p className="dark:text-gray-300">End: {new Date(project.end_date).toLocaleDateString()}</p>
            <ProgressBar percent={project.progress_percent || 0} />

            {role === 'admin' && (
              <Button
                className={`mt-2 ${purpleButton}`}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  openCostModal();
                }}
              >
                Add Cost
              </Button>
            )}
          </div>
        ))}
        {filteredProjects.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 italic">No projects found.</p>
        )}
      </div>
    </>
  );
};

export default AdminProjectDetails;
