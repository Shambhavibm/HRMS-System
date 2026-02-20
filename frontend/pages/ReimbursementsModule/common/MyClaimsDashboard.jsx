import React from 'react';
import ReimbursementDashboard from './ReimbursementDashboard';
import MyClaimsHistoryTable from './MyClaimsHistoryTable'; // ✅ Import the new table

const MyClaimsDashboard = () => (
    <ReimbursementDashboard
        fetchUrl="/api/reimbursements/my-claims"
        dashboardTitle="Yearly Summary"
        listTitle="Detailed Claim History"
        showStatusFilter={true}
    >
        {/* ✅ Use the new table component to render the claims data */}
        {({ claims }) => (
            <MyClaimsHistoryTable claims={claims} />
        )}
    </ReimbursementDashboard>
);

export default MyClaimsDashboard;