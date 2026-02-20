import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AdminOverview from './AdminOverview';
import AdminProjectDetails from './AdminProjectDetails';
import AdminCostHistory from './AdminCostHistory';
import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../../components/ui/modal";
import Button from '../../../components/ui/button/Button';

import Input from '../../../components/form/input/Input';
import Label from "../../../components/form/Label";
import { PieChartIcon } from '../../../icons';

const Dashboard = ({ role, token }) => {
  const [projects, setProjects] = useState([]);
  const [costSummary, setCostSummary] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const { isOpen: isCostModalOpen, openModal: openCostModal, closeModal: closeCostModal } = useModal();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [costData, setCostData] = useState({ item_name: '', amount: '', description: '', category: '' });

  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/').pop();

  const primaryButtonClass = "px-4 py-2 rounded-md text-white font-semibold transition-colors duration-200";
  const purpleButton = `${primaryButtonClass} bg-purple-600 hover:bg-purple-700`;

  // Initial redirect if no tab is selected
  useEffect(() => {
    if (role === 'admin' && location.pathname === '/admin/project-progress') {
      navigate('/admin/project-progress/overview', { replace: true });
    }
  }, [role, navigate, location.pathname]);

  // Fetch project data based on tab
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const transformed = res.data.map(p => ({
          id: p.project_id,
          name: p.project_name,
          client_name: p.client_name,
          status: p.status,
          start_date: p.start_date,
          end_date: p.end_date,
          progress_percent: p.progress_percent,
        }));
        setProjects(transformed);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    const fetchCostSummary = async () => {
      try {
        const res = await axios.get('/api/summary/grouped', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCostSummary(res.data);
      } catch (err) {
        console.error("Error fetching cost summary:", err);
      }
    };

    const fetchWeeklyProgress = async () => {
      try {
        const res = await axios.get('/api/projects/weekly-progress-summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWeeklyProgress(res.data);
      } catch (err) {
        console.error("Error fetching weekly progress summary:", err);
      }
    };

    if (role === 'admin') {
      if (activeTab === 'overview') {
        fetchCostSummary();
        fetchWeeklyProgress();
      } else if (activeTab === 'details') {
        fetchProjects();
      }
    }
  }, [token, role, activeTab]);

  const handleSubmitCost = async () => {
    const { item_name, description, category, amount } = costData;

    if (!item_name || item_name.trim() === '' || !category || category.trim() === '' || amount === '' || isNaN(parseFloat(amount))) {
      alert('All fields are required');
      return;
    }

    try {
      await axios.post(`/api/projects/${selectedProjectId}/costs`, costData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeCostModal();
      setCostData({ item_name: '', description: '', category: '', amount: '' });
      alert('Cost entry added');
      const res = await axios.get('/api/summary/grouped', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCostSummary(res.data);
    } catch (err) {
      console.error("❌ Failed to add cost entry:", err);
      alert('Server error while submitting');
    }
  };

  const filteredAndSortedProjects = useMemo(() => {
    const current = [...projects];
    current.sort((a, b) => b.id - a.id);
    return current;
  }, [projects]);

  const ProgressBar = ({ percent }) => (
    <div style={{ width: '100%', background: '#eee', borderRadius: 4, marginTop: '8px' }}>
      <div style={{
        width: `${percent}%`,
        background: 'green',
        height: 20,
        borderRadius: 4,
        color: '#fff',
        textAlign: 'center',
        lineHeight: '20px'
      }}>
        {percent}%
      </div>
    </div>
  );

  const TabButton = ({ id, title, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
        ${activeTab === id
          ? 'bg-brand-500 text-white shadow'
          : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}
    >
      {title}
    </button>
  );

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Heading and subheading */}
        <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <PieChartIcon className="w-8 h-8 text-brand-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Project Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Admin Dashboard: Manage projects, track progress, and control costs.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {role === 'admin' && (
          <div className="mb-6">
            <div className="flex space-x-3 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
              <TabButton id="overview" title="Overview" onClick={() => navigate('/admin/project-progress/overview')} />
              <TabButton id="details" title="Project Details" onClick={() => navigate('/admin/project-progress/details')} />
              <TabButton id="cost-history" title="Cost History" onClick={() => navigate('/admin/project-progress/cost-history')} />
            </div>
          </div>
        )}

        {/* Route Content */}
        <Routes>
          <Route path="overview" element={<AdminOverview costSummary={costSummary} weeklyProgress={weeklyProgress} />} />
          <Route path="details" element={
            <AdminProjectDetails
              projects={filteredAndSortedProjects}
              role={role}
              token={token}
              setSelectedProjectId={setSelectedProjectId}
              openCostModal={openCostModal}
              purpleButton={purpleButton}
              ProgressBar={ProgressBar}
            />
          } />
          <Route path="cost-history" element={<AdminCostHistory token={token} isActive={activeTab === 'cost-history'} />} />
          <Route path="*" element={<AdminOverview costSummary={costSummary} weeklyProgress={weeklyProgress} />} />
        </Routes>
      </div>

      {/* Modal for Adding Cost */}
      <Modal isOpen={isCostModalOpen} onClose={closeCostModal} className="max-w-md">
                <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white/90">Add Project Cost</h2>

                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                        id="item-name"
                        className="w-full border border-gray-300 mb-3 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Item Name"
                        value={costData.item_name}
                        onChange={e => setCostData({ ...costData, item_name: e.target.value })}
                    />

                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        className="w-full border border-gray-300 mb-3 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter description"
                        value={costData.description}
                        onChange={e => setCostData({ ...costData, description: e.target.value })}
                    />

                    <Label htmlFor="category">Category</Label>
                    <select
                        id="category"
                        className="w-full border border-gray-300 mb-3 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={costData.category}
                        onChange={e => setCostData({ ...costData, category: e.target.value })}
                    >
                        <option value="">Select Option</option>
                        <option value="Hardware">Hardware Resource</option>
                        <option value="Software">Software Resource</option>
                        <option value="Resource">Human Resource</option>
                        <option value="others">Others Resource</option>
                    </select>

                    <Label htmlFor="amount">Amount</Label>
                    <Input
                        id="amount"
                        type="number"
                        className="w-full border border-gray-300 mb-4 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Amount"
                        value={costData.amount}
                        onChange={e => setCostData({ ...costData, amount: e.target.value })}
                    />

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={closeCostModal}>Cancel</Button>
                        <Button onClick={handleSubmitCost}>Add</Button>
                    </div>
                </div>
            </Modal>
    </div>
  );
};

export default Dashboard;