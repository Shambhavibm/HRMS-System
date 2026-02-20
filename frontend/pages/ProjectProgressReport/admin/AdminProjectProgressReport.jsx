

import Dashboard from './AdminProjectProgressReportMasterDashboard';

const AdminProjectProgressDashboard = () => {
  const token = localStorage.getItem('token');
  return <Dashboard role="admin" token={token} />;
};

export default AdminProjectProgressDashboard;
