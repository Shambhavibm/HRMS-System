
import React, { useState } from 'react';
import TeamApprovalsList from '../manager/TeamApprovalsList';
import ApprovalHistoryList from '../common/ApprovalHistoryList';
import PayrollProcessingList from './PayrollProcessingList'; // Import the new component

const AdminClaimsView = () => {
    const [activeTab, setActiveTab] = useState('pending');

    const TabButton = ({ id, title }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
                ${activeTab === id
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`
            }
        >
            {title}
        </button>
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-lg">
                <TabButton id="pending" title="Pending Approvals" />
                <TabButton id="history" title="My Approval History" />
                <TabButton id="payroll" title="Process Payroll" />
            </div>

            <div>
                {activeTab === 'pending' && <TeamApprovalsList />}
                {activeTab === 'history' && <ApprovalHistoryList />}
                {activeTab === 'payroll' && <PayrollProcessingList />}
            </div>
        </div>
    );
};

export default AdminClaimsView;