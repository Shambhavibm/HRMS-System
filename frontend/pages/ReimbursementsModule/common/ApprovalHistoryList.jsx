
import React from 'react';
import ReimbursementDashboard from './ReimbursementDashboard';
import ApprovalHistoryTable from './ApprovalHistoryTable';

const ApprovalHistoryList = () => (
    <ReimbursementDashboard
        fetchUrl="/api/reimbursements/my-approval-history"
        dashboardTitle="My Actions on Claims"
        listTitle="Approval & Rejection History"
        showStatusFilter={true}
    >
        {/* ✅ Renders the imported table component, passing the claims data to it */}
        {({ claims }) => (
            <ApprovalHistoryTable claims={claims} />
        )}
    </ReimbursementDashboard>
);

export default ApprovalHistoryList;