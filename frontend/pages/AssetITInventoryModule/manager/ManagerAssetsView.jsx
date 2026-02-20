// This will be the main container for the manager's asset management view, organizing various functionalities into tabs. 

import React, { useState } from 'react';
import AssetRequestForm from '../common/AssetRequestForm';
import AssetDashboardTemplate from '../common/AssetDashboardTemplate';
import TeamAssetApprovalsList from './TeamAssetApprovalsList';
import MyAssetsTable from '../member/MyAssetsTable'; // Reusing from member
import MyAssetRequestsTable from '../member/MyAssetRequestsTable'; // Reusing from member
import AssetApprovalHistoryList from '../common/AssetApprovalHistoryList'; // Will create this common component next

const ManagerAssetsView = () => {
    const [activeTab, setActiveTab] = useState('approvals');
    const [refreshTrigger, setRefreshTrigger] = useState(0); // To force data refresh across tabs

    const handleRequestSubmitted = () => {
        console.log('[DEBUG] Asset request submitted. Triggering refresh and switching to My Requests tab.');
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('my_requests'); // Switch to requests history after submission
    };

    const TabButton = ({ id, title, count }) => {
        console.log(`[DEBUG] Rendering TabButton: id=${id}, title=${title}, count=${count}, activeTab=${activeTab}`);
        return (
            <button
                onClick={() => {
                    console.log(`[DEBUG] TabButton clicked: ${id}`);
                    setActiveTab(id);
                }}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${activeTab === id
                        ? 'bg-brand-500 text-white shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`
                }
            >
                <span>{title}</span>
                {/* Conditional rendering for count, fetch from a real endpoint */}
                {count > 0 && <span className="px-2 py-0.5 text-xs font-bold bg-white text-brand-600 rounded-full">{count}</span>}
            </button>
        );
    };

    // In a real app, you would fetch pending approval count here
    const pendingApprovalsCount = 0; // Placeholder

    console.log('[DEBUG] Rendering ManagerAssetsView. activeTab:', activeTab, 'refreshTrigger:', refreshTrigger);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex flex-wrap gap-2 mb-6 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-lg">
                 <TabButton id="approvals" title="Team Approvals" count={pendingApprovalsCount} />
                 <TabButton id="my_requests" title="My Asset Requests" />
                 <TabButton id="my_assets" title="My Assigned Assets" />
                 <TabButton id="history" title="My Approval History" />
                 <TabButton id="submit" title="Request New Asset" />
            </div>

            <div>
                {/* Render content based on active tab */}
                {activeTab === 'approvals' && (
                    (() => {
                        console.log('[DEBUG] Rendering <TeamAssetApprovalsList /> tab, refreshTrigger:', refreshTrigger);
                        return <TeamAssetApprovalsList key={`approvals-${refreshTrigger}`} />;
                    })()
                )}
                {activeTab === 'my_requests' && (
                    (() => {
                        console.log('[DEBUG] Rendering <AssetDashboardTemplate> for MyAssetRequestsTable, refreshTrigger:', refreshTrigger);
                        return (
                            <AssetDashboardTemplate
                                key={`my-requests-${refreshTrigger}`}
                                fetchUrl="/api/assets/requests/my-requests"
                                listTitle="My IT Asset Request History"
                                showCategoryFilter={true}
                                showStatusFilter={true}
                            >
                                {({ data }) => {
                                    console.log('[DEBUG] Rendering <MyAssetRequestsTable />, data:', data);
                                    return <MyAssetRequestsTable data={data} />;
                                }}
                            </AssetDashboardTemplate>
                        );
                    })()
                )}
                {activeTab === 'my_assets' && (
                    (() => {
                        console.log('[DEBUG] Rendering <AssetDashboardTemplate> for MyAssetsTable, refreshTrigger:', refreshTrigger);
                        return (
                            <AssetDashboardTemplate
                                key={`my-assets-${refreshTrigger}`}
                                fetchUrl="/api/assets/my-assigned-assets"
                                listTitle="Assets Currently Assigned to Me"
                                showCategoryFilter={true}
                                showStatusFilter={true}
                            >
                                {({ data }) => {
                                    console.log('[DEBUG] Rendering <MyAssetsTable />, data:', data);
                                    return <MyAssetsTable data={data} />;
                                }}
                            </AssetDashboardTemplate>
                        );
                    })()
                )}
                {activeTab === 'history' && (
                    (() => {
                        console.log('[DEBUG] Rendering <AssetApprovalHistoryList />, refreshTrigger:', refreshTrigger);
                        return <AssetApprovalHistoryList key={`history-${refreshTrigger}`} />;
                    })()
                )}
                {activeTab === 'submit' && (
                    (() => {
                        console.log('[DEBUG] Rendering <AssetRequestForm />, refreshTrigger:', refreshTrigger);
                        return <AssetRequestForm onRequestSubmitted={handleRequestSubmitted} />;
                    })()
                )}
            </div>
        </div>
    );
};

export default ManagerAssetsView;