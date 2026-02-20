import React, { useState } from 'react';
import SubmitClaimForm from '../common/SubmitClaimForm';
import TeamApprovalsList from './TeamApprovalsList';
import MyClaimsDashboard from '../common/MyClaimsDashboard'; 
import ApprovalHistoryList from '../common/ApprovalHistoryList'; 

const ManagerClaimsView = () => {
    const [activeTab, setActiveTab] = useState('my_claims');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleClaimSubmitted = () => {
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('my_claims');
    };
    
    const TabButton = ({ id, title, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
                ${activeTab === id
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`
            }
        >
            <span>{title}</span>
            {count > 0 && <span className="px-2 py-0.5 text-xs font-bold bg-white text-brand-600 rounded-full">{count}</span>}
        </button>
    );

    // In a real app, you'd fetch the count for the approvals tab
    const pendingCount = 0; // Placeholder

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-lg">
                 <TabButton id="my_claims" title="My Claim History" />
                 <TabButton id="approvals" title="Team Approvals" count={0} />
                 <TabButton id="history" title="Approval History" />
                 <TabButton id="submit" title="Submit New Claim" />
            </div>

            <div>
                {activeTab === 'approvals' && <TeamApprovalsList />}
                {activeTab === 'history' && <ApprovalHistoryList />}
                {activeTab === 'submit' && <SubmitClaimForm onClaimSubmitted={handleClaimSubmitted} />}
                {/* ✅ Render the new dashboard instead of the old list */}
                {activeTab === 'my_claims' && <MyClaimsDashboard />} 
            </div>
        </div>
    );
};


export default ManagerClaimsView;