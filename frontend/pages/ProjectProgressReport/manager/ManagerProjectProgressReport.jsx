
import React, { useState } from 'react';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import ManagerProjectNavTabs from './ManagerProjectNavTabs';
import ManagerProjectDetails from './ManagerProjectDetails';
import ManagerPendingApprovals from './ManagerPendingApprovals';
import ManagerApprovalHistory from './ManagerApprovalHistory';

const ManagerProjectProgressDashboard = ({ token }) => {
  const [activeTab, setActiveTab] = useState('details');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return <ManagerProjectDetails token={token} />;
      case 'approvals':
        return <ManagerPendingApprovals token={token} />;
      case 'history':
        return <ManagerApprovalHistory token={token} />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageMeta title="VipraGo | Manager Project Dashboard" description="Manager project activity view" />
      <PageBreadcrumb pageTitle="Project Management" />

      <ComponentCard>
        <ManagerProjectNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-4">
          {renderTabContent()}
        </div>
      </ComponentCard>
    </>
  );
};

export default ManagerProjectProgressDashboard;
