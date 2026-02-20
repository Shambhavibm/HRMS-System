
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useModal } from '../../../pages/../hooks/useModal';
import { Modal } from '../../../pages/../components/ui/modal';
import Button from '../../../pages/../components/ui/button/Button';
import Input from '../../../pages/../components/form/input/Input';
import Label from '../../../pages/../components/form/Label';
import ProgressChart from "../common/ProgressChart";
import { PieChartIcon } from '../../../icons'; // Assuming PieChartIcon is available

const MemberProjectProgress = ({ token, userId, role }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [updateData, setUpdateData] = useState({ description: '', work_done: '', progress_percent: '' });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalError, setModalError] = useState('');

  const { isOpen: isUpdateModalOpen, openModal: openUpdateModal, closeModal: closeUpdateModal } = useModal();

  const ProgressBar = ({ percent }) => (
    <div style={{ width: '100%', background: '#eee', borderRadius: 4, marginTop: '8px' }}>
      <div style={{ width: `${percent}%`, background: 'green', height: 20, borderRadius: 4, color: '#fff', textAlign: 'center', lineHeight: '20px' }}>{percent}%</div>
    </div>
  );

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      if (!userId || !token) {
        console.warn("MemberProjectProgress: userId or token missing. Skipping API call.");
        return;
      }

      try {
        const res = await axios.get('api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
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
        setError(''); 
      } catch (err) {
        console.error("Error fetching assigned projects for member:", err);
        setError('Failed to load your assigned projects. Please try again.');
      }
    };

    fetchAssignedProjects();
  }, [token, userId]); 

  const handleSubmitUpdate = async () => {
  const { description, work_done, progress_percent } = updateData;
  if (!description || !work_done || progress_percent === '') {
    setModalError('All fields are required.');
    return;
  }
  if (progress_percent < 0 || progress_percent > 100) {
    setModalError('Progress percent must be between 0 and 100.');
    return;
  }
  if (!selectedProjectId) {
    setModalError('No project selected for update.');
    return;
  }
  if (!token) {
    setModalError('Authentication token missing. Please log in again.');
    return;
  }

  try {
    await axios.post(`api/projects/${selectedProjectId}/updates`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Clear errors and reset form
    setModalError('');
    setUpdateData({ description: '', work_done: '', progress_percent: '' });

    // Close modal and show alert
    closeUpdateModal();
    alert('Update submitted for approval');

    // Re-fetch latest projects
    const res = await axios.get(`api/projects/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

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
    setError(''); 
  } catch (err) {
    console.error("Failed to submit update:", err);

    // Handle errors from submission or refetch
    if (err.response && err.response.status >= 400) {
      setModalError('Failed to submit update.');
    } else {
      setError('Failed to reload updated project list.');
    }
  }
};


  const filteredAndSortedProjects = React.useMemo(() => {
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
      const handleCloseModal = () => {
        setError(''); 
        closeUpdateModal(); 
      };


  return (
    <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        {/* Heading and subheading - Added similar to Dashboard component */}
        <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <PieChartIcon className="w-8 h-8 text-brand-500" />
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Member Project Progress</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    View your assigned projects and submit progress updates for approval.
                </p>
            </div>
        </div>

      <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Assigned Projects</h2>
      <div className="w-1/3">
        <Input
          type="text"
          placeholder="Search projects..."
          className="w-full border border-black p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-white dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>



      <div className="grid gap-4">
        {filteredAndSortedProjects.length > 0 ? (
          filteredAndSortedProjects.map(project => (
            <div key={project.id} className="border p-4 rounded shadow dark:border-gray-700 dark:bg-gray-800">
              <h3 className="text-xl font-semibold dark:text-white">{project.name}</h3>
              <p className="dark:text-gray-300">Customer: {project.client_name}</p>
              <p className="dark:text-gray-300">Status: <strong>{project.status}</strong></p>
              <p className="dark:text-gray-300">
                Start: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
              </p>
              <p className="dark:text-gray-300">
                End: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
              </p>

              <ProgressBar percent={project.progress_percent || 0} />

              {/* Submit Update button for members */}
              {(role === 'member' || role === 'manager') && ( // Ensure only members can see this button
                <Button
                  variant="primary"
                  className="mt-2"
                  onClick={() => { setSelectedProjectId(project.id); openUpdateModal(); }}
                >
                  Submit Update
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-600 italic dark:text-gray-400">
            {token && userId ? "No projects assigned to you or no matching projects found." : "Loading projects..."}
          </p>
        )}
      </div>

      {/* Update Modal (Member) */}
      <Modal isOpen={isUpdateModalOpen} onClose={handleCloseModal} className="max-w-md z-[10]">
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white/90">Submit Project Update</h2>
          {/* {modalError && <p className="text-red-600 text-sm mb-3">{modalError}</p>} */}
          <Label htmlFor="update-description">Description</Label>
          <textarea
            id="update-description"
            className="w-full border border-gray-300 mb-3 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Description"
            value={updateData.description}
            onChange={e => setUpdateData({ ...updateData, description: e.target.value })}
          />
          <Label htmlFor="work-done">Work Done</Label>
          <textarea
            id="work-done"
            className="w-full border border-gray-300 mb-3 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Work Done"
            value={updateData.work_done}
            onChange={e => setUpdateData({ ...updateData, work_done: e.target.value })}
          />
          <Label htmlFor="progress-percent">Progress %</Label>
          <Input
            id="progress-percent"
            type="number"
            className="w-full border border-gray-300 mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Progress %"
            value={updateData.progress_percent}
            onChange={e => setUpdateData({ ...updateData, progress_percent: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeUpdateModal}>Cancel</Button>
            <Button onClick={handleSubmitUpdate}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberProjectProgress;
