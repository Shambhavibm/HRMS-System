// frontend/pages/TeamsManagement/admin/TeamManagement.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';

import CreateTeam from './CreateTeam';
import AssignMembers from './AssignMembers';
import AssignManagers from './AssignManagers';
import EditTeamList from './EditTeamList';

const tabMap = {
  create: 'Create Team',
  assign: 'Assign Members',
  edit: 'Edit Team',
  managers: 'Assign Managers',
};

const TeamManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active tab from URL pathname: e.g. /admin/teams/manage/create
  const pathParts = location.pathname.split('/');
  const urlTab = pathParts[pathParts.length - 1];
  const isValidTab = Object.keys(tabMap).includes(urlTab);
  const [activeTab, setActiveTab] = useState(isValidTab ? urlTab : 'create');

  // Sync tab when URL changes
  useEffect(() => {
    if (isValidTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab, isValidTab]);

  // When tab clicked, navigate to corresponding route
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/admin/teams/manage/${tab}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <CreateTeam />;
      case 'assign':
        return <AssignMembers />;
      case 'edit':
        return <EditTeamList />;
      case 'managers':
        return <AssignManagers />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageMeta title="Team Management | VipraGo" />
      <PageBreadcrumb pageTitle="Admin Dashboard: Manage Teams" />

      <ComponentCard>
        {/* Tab Headers */}
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          {Object.entries(tabMap).map(([tabId, label]) => (
            <button
              key={tabId}
              onClick={() => handleTabClick(tabId)}
              className={`px-4 py-2 text-sm font-medium focus:outline-none transition duration-300 ease-in-out ${
                activeTab === tabId
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6 transition-all duration-300 ease-in-out">{renderContent()}</div>
      </ComponentCard>
    </>
  );
};

export default TeamManagement;
