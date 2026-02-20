
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import ProgressChart from "../common/ProgressChart";
import Input from '../../../pages/../components/form/input/Input'; 
import Button from '../../../pages/../components/ui/button/Button'; 
import { Toaster } from 'react-hot-toast';

const ManagerProjectDetails = ({ token }) => {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [selectedProjectId, setSelectedProjectId] = useState(null); 
  const primaryButtonClass = "px-4 py-2 rounded-md text-white font-semibold transition-colors duration-200";
  const greenButton = `${primaryButtonClass} bg-green-600 hover:bg-green-700`;


  const ProgressBar = ({ percent }) => (
    <div style={{ width: '100%', background: '#eee', borderRadius: 4, marginTop: '8px' }}>
      <div style={{ width: `${percent}%`, background: 'green', height: 20, borderRadius: 4, color: '#fff', textAlign: 'center', lineHeight: '20px' }}>{percent}%</div>
    </div>
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('api/projects', { headers: { Authorization: `Bearer ${token}` } });
        const transformedProjects = res.data.map(p => ({
          id: p.project_id,
          name: p.project_name,
          client_name: p.client_name,
          status: p.status,
          start_date: p.start_date,
          end_date: p.end_date,
          progress_percent: p.progress_percent,
        }));
        setProjects(transformedProjects);
      } catch (err) {
        console.error("Error fetching projects for manager:", err);
      }
    };

    fetchProjects();
  }, [token]);

  const filteredAndSortedProjects = useMemo(() => {
    let currentProjects = [...projects];

    if (searchTerm) {
      currentProjects = currentProjects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    currentProjects.sort((a, b) => b.id - a.id); 

    return currentProjects;
  }, [projects, searchTerm]);

  return (
    <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
     <div className="mb-6 flex items-center justify-between">
  <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">My Projects</h2>
  <div className="w-1/3">
    <Input
      type="text"
      placeholder="Search projects by name or client"
      className="w-full border border-black p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-white dark:text-white"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>


      <div className="grid gap-4">
        {filteredAndSortedProjects.map(project => (
          <div key={project.id} className="border p-4 rounded shadow dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-xl font-semibold dark:text-white">{project.name}</h3>
            <p className="dark:text-gray-300">Customer: {project.client_name}</p>
            <p className="dark:text-gray-300">Status: <strong>{project.status}</strong></p>
            <p className="dark:text-gray-300">Start: {new Date(project.start_date).toLocaleDateString()}</p>
            <p className="dark:text-gray-300">End: {new Date(project.end_date).toLocaleDateString()}</p>
            <ProgressBar percent={project.progress_percent || 0} />
            <ProgressChart projectId={project.id} token={token} />
          </div>
        ))}
        {filteredAndSortedProjects.length === 0 && (
            <p className="text-gray-600 italic dark:text-gray-400">No projects found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default ManagerProjectDetails;