// This is the main container for the member's asset management view, providing tabs for submitting new requests and viewing their assigned assets.
// AssetITInventoryModule/member/MemberAssetsView.jsx
import React, { useState } from 'react';
import AssetRequestForm from '../common/AssetRequestForm';
import AssetDashboardTemplate from '../common/AssetDashboardTemplate';
import MyAssetsTable from './MyAssetsTable';
import MyAssetRequestsTable from './MyAssetRequestsTable'; // We will create this next
import { BriefcaseIcon, BoxCubeIcon } from '../../../icons'; // Assuming these icons are available

const MemberAssetsView = () => {
    const [activeTab, setActiveTab] = useState('my_assets'); // Default to showing assigned assets
    const [refreshTrigger, setRefreshTrigger] = useState(0); // To force refresh of data

    const handleRequestSubmitted = () => {
        setRefreshTrigger(prev => prev + 1); // Increment to trigger data refetch
        setActiveTab('my_requests'); // Switch to requests history after submission
    };

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
            <div className="flex space-x-2 mb-6 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-lg">
                <TabButton id="my_assets" title="My Assigned Assets" />
                <TabButton id="my_requests" title="My Asset Requests" />
                <TabButton id="submit" title="Request New Asset" />
            </div>

            <div>
                {/* Render content based on active tab */}
                {activeTab === 'submit' && (
                    <AssetRequestForm onRequestSubmitted={handleRequestSubmitted} />
                )}
                {activeTab === 'my_assets' && (
                    <AssetDashboardTemplate
                        key={`my-assets-${refreshTrigger}`} // Key to force re-render/refetch
                        fetchUrl="/api/assets/my-assigned-assets"
                        listTitle="Assets Currently Assigned to Me"
                        showCategoryFilter={true}
                        showStatusFilter={true} // Show status filter for asset current_status
                    >
                        {({ data }) => (
                            <MyAssetsTable data={data} />
                        )}
                    </AssetDashboardTemplate>
                )}
                {activeTab === 'my_requests' && (
                    <AssetDashboardTemplate
                        key={`my-requests-${refreshTrigger}`} // Key to force re-render/refetch
                        fetchUrl="/api/assets/requests/my-requests"
                        listTitle="My IT Asset Request History"
                        showCategoryFilter={true}
                        showStatusFilter={true} // Show status filter for asset request current_status
                    >
                        {({ data, refreshData }) => ( // Pass refreshData to the table if it has actions
                            <MyAssetRequestsTable data={data} refreshData={refreshData} />
                        )}
                    </AssetDashboardTemplate>
                )}
            </div>
        </div>
    );
};

export default MemberAssetsView;