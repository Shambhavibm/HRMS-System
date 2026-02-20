// frontend/pages/AssetITInventoryModule/common/AssetApprovalHistoryList.jsx
import React from 'react';
import AssetDashboardTemplate from './AssetDashboardTemplate';
import AssetGenericTable from './AssetGenericTable';
import AssetStatusBadge from './AssetStatusBadge';
import { LinkIcon } from '../../../icons';

const AssetApprovalHistoryList = () => {
    const columns = [
        {
            header: 'Requester',
            cell: (request) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.requester?.first_name} {request.requester?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {/* ✅ FIX 1: Using official_email_id to display the requester's email correctly */}
                        {request.requester?.official_email_id}
                    </div>
                </>
            ),
        },
        {
            header: 'Request Type',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {request.category?.name || 'N/A'} - {request.request_type}
                </div>
            ),
        },
        {
            header: 'Final Status',
            cell: (request) => <AssetStatusBadge status={request.current_status} />,
        },
        {
            header: 'Final Action By',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {request.finalApprover ? `${request.finalApprover.first_name} ${request.finalApprover.last_name}` : 'N/A'}
                </div>
            ),
        },
        {
            header: 'Action Date',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(request.updated_at).toLocaleDateString()}
                </div>
            ),
        },
        {
            header: 'Document',
            textAlign: 'center',
            cell: (request) => (
                request.document_path ? (
                    <a href={`http://localhost:5001/${request.document_path}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300">
                        <LinkIcon className="h-5 w-5 mx-auto" />
                    </a>
                ) : (
                    <span className="text-gray-400 text-xs">None</span>
                )
            ),
        },
    ];

    return (
        <AssetDashboardTemplate
            fetchUrl="/api/assets/requests/my-approval-history"
            listTitle="My Asset Approval & Rejection History"
            showCategoryFilter={true}
            showStatusFilter={true}
        >
            {/* ✅ FIX 2: Using the more robust and defensive render function pattern */}
            {(props) => {
                if (!props) return <div className="p-8 text-center text-red-500">Error: Data not provided.</div>;
                const { data, isLoading: dataLoading } = props;

                if (dataLoading) {
                    return <div className="p-8 text-center text-gray-500">Loading approval history...</div>;
                }

                if (!Array.isArray(data)) {
                    return <div className="p-8 text-center text-red-500">Error: Invalid data format received.</div>;
                }

                return data.length > 0 ? (
                    <AssetGenericTable
                        columns={columns}
                        data={data}
                        noDataMessage="No asset approval history found for the selected filters."
                    />
                ) : (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-500 dark:border-gray-600">
                        <p className="font-semibold">No History Found</p>
                        <p className="text-sm">You have not taken final action on any asset requests yet.</p>
                    </div>
                );
            }}
        </AssetDashboardTemplate>
    );
};

export default AssetApprovalHistoryList;