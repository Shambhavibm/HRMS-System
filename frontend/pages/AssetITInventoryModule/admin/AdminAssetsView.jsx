// frontend/pages/AssetITInventoryModule/admin/AdminAssetsView.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AllAssetRequestsTable from './AllAssetRequestsTable';
import PhysicalAssetsInventoryTable from './PhysicalAssetsInventoryTable';
import AssignedFulfillmentList from './AssignedFulfillmentList';
import AssetClearanceList from './AssetClearanceList';
import AssetApprovalHistoryList from '../common/AssetApprovalHistoryList';
import AssetDashboardTemplate from '../common/AssetDashboardTemplate';
import ManageAssetCategories from './ManageAssetCategories';
import TeamAssetApprovalsList from '../manager/TeamAssetApprovalsList'; // ✅ 1. IMPORT THE REUSABLE COMPONENT

const AdminAssetsView = () => {
    // Set the default tab to the new 'team_approvals' tab
    const [activeTab, setActiveTab] = useState('team_approvals'); 
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [assetCategories, setAssetCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/assets/categories', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setAssetCategories(response.data);
            } catch (error) {
                console.error("Error fetching asset categories for admin view:", error);
            }
        };
        fetchCategories();
    }, []);

    const TabButton = ({ id, title }) => (
        <button
            onClick={() => {
                setActiveTab(id);
                setRefreshTrigger(prev => prev + 1);
            }}
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
                {/* ✅ 2. ADD THE NEW TAB BUTTON */}
                <TabButton id="team_approvals" title="Team Approvals" />
                <TabButton id="fulfillment" title="Fulfillment Tasks" />
                <TabButton id="all_requests" title="All Asset Requests" />
                <TabButton id="inventory" title="Physical Assets Inventory" />
                <TabButton id="clearance" title="Asset Clearance" />
                <TabButton id="history" title="My Approval History" />
                <TabButton id="manage_categories" title="Manage Categories" />
            </div>

            <div>
                {/* ✅ 3. ADD THE RENDER LOGIC FOR THE NEW TAB */}
                {activeTab === 'team_approvals' && (
                    <TeamAssetApprovalsList key={`team_approvals-${refreshTrigger}`} />
                )}
                {activeTab === 'fulfillment' && (
                    <AssignedFulfillmentList key={`fulfillment-${refreshTrigger}`} />
                )}
                {activeTab === 'all_requests' && (
                    <AssetDashboardTemplate
                        key={`all_requests-${refreshTrigger}`}
                        fetchUrl="/api/assets/requests/all"
                        listTitle="All IT Asset Requests"
                        showCategoryFilter={true}
                        showStatusFilter={true}
                    >
                        {({ data, refreshData }) => (
                            <AllAssetRequestsTable data={data} refreshData={refreshData} />
                        )}
                    </AssetDashboardTemplate>
                )}
                {activeTab === 'inventory' && (
                    <AssetDashboardTemplate
                        key={`inventory-${refreshTrigger}`}
                        fetchUrl="/api/assets/inventory/all"
                        listTitle="Physical IT Assets Inventory"
                        showCategoryFilter={true}
                        showStatusFilter={true}
                    >
                        {({ data, refreshData }) => (
                            <PhysicalAssetsInventoryTable data={data} refreshData={refreshData} categories={assetCategories} />
                        )}
                    </AssetDashboardTemplate>
                )}
                {activeTab === 'clearance' && (
                    <AssetClearanceList key={`clearance-${refreshTrigger}`} />
                )}
                {activeTab === 'history' && (
                    <AssetApprovalHistoryList key={`history-${refreshTrigger}`} />
                )}
                {activeTab === 'manage_categories' && (
                    <ManageAssetCategories key={`manage_categories-${refreshTrigger}`} />
                )}
            </div>
        </div>
    );
};

export default AdminAssetsView;