// AssetITInventoryModule/member/MyAssetRequestsTable.jsx
//This table will show the history and status of asset requests submitted by the member.
import React from 'react';
import AssetGenericTable from '../common/AssetGenericTable';
import AssetStatusBadge from '../common/AssetStatusBadge';
import AssetInfoField from '../common/AssetInfoField'; // For general info display
import { LinkIcon } from '../../../icons'; // Assuming you have a LinkIcon

const MyAssetRequestsTable = ({ data, refreshData }) => {
    const columns = [
        {
            header: 'Request',
            cell: (request) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.category?.name || 'N/A'} - {request.request_type}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {request.preferred_model ? `Pref: ${request.preferred_model}` : 'No model pref.'}
                    </div>
                </>
            ),
        },
        {
            header: 'Justification',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                    {request.justification}
                </div>
            ),
        },
        {
            header: 'Status',
            cell: (request) => <AssetStatusBadge status={request.current_status} />,
        },
        {
            header: 'Submitted On',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(request.created_at).toLocaleDateString()}
                </div>
            ),
        },
        {
            header: 'Urgency',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {request.urgency}
                </div>
            ),
        },
        {
            header: 'Approver',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {request.primaryApprover ? `${request.primaryApprover.first_name} ${request.primaryApprover.last_name}` : 'N/A'}
                    {request.secondaryApprover && ` / ${request.secondaryApprover.first_name.charAt(0)}. ${request.secondaryApprover.last_name}`}
                </div>
            ),
        },
        {
            header: 'Document',
            textAlign: 'center',
            cell: (request) => (
                request.document_path ? (
                    <a href={`http://localhost:5000/${request.document_path}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300">
                        <LinkIcon className="h-5 w-5 mx-auto" />
                    </a>
                ) : (
                    <span className="text-gray-400">N/A</span>
                )
            ),
        },
        // You might add an "Action" column here if members can cancel requests (only if backend allows)
    ];

    return (
        <AssetGenericTable
            columns={columns}
            data={data}
            noDataMessage="You have not submitted any IT asset requests yet."
        />
    );
};

export default MyAssetRequestsTable;