import React from 'react';
import ReimbursementDashboard from '../common/ReimbursementDashboard';
import PayrollClaimsTable from './PayrollClaimsTable'; // Import the new table component

const PayrollProcessingList = () => (
    <ReimbursementDashboard
        fetchUrl="/api/reimbursements/approved-for-admin"
        dashboardTitle="Organizational Summary"
        listTitle="Claims to Process"
        showStatusFilter={false} // No status filter needed here
    >
        {({ claims }) => (
            <PayrollClaimsTable claims={claims} />
        )}
    </ReimbursementDashboard>
);

export default PayrollProcessingList;