import React from 'react';
import { PieChartIcon } from '../../../icons'; 
const ManagerProjectNavTabs = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'details', title: 'Project Details' },
        { id: 'approvals', title: 'Pending Approvals' },
        { id: 'history', title: 'Approval History' },
    ];

    const TabButton = ({ id, title }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${activeTab === id
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}
        >
            {title}
        </button>
    );

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <PieChartIcon className="w-8 h-8 text-brand-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manager Dashboard</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            View and manage your assigned projects, track progress, and handle approvals.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-2">
                    <div className="flex space-x-3 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                        {tabs.map(tab => (
                            <TabButton key={tab.id} id={tab.id} title={tab.title} />
                        ))}
                    </div>
                </div>

                {/* Tab Content Placeholder - Replace with your components */}
                <div className="mt-2">
                    {activeTab === 'details' && (
                        <div>{/* <ProjectDetails /> */}</div>
                    )}
                    {activeTab === 'approvals' && (
                        <div>{/* <PendingApprovals /> */}</div>
                    )}
                    {activeTab === 'history' && (
                        <div>{/* <ApprovalHistory /> */}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagerProjectNavTabs;
