// AssetITInventoryModule/admin/AllAssetRequestsTable.jsx
// This table provides the Admin with a comprehensive view of all asset requests in the system, regardless of status or requester.
import React from 'react';
import AssetGenericTable from '../common/AssetGenericTable';
import AssetStatusBadge from '../common/AssetStatusBadge';
import AssetInfoField from '../common/AssetInfoField';
import { LinkIcon } from '../../../icons'; // Assuming LinkIcon is available

const AllAssetRequestsTable = ({ data, refreshData }) => { // refreshData passed to enable actions that refresh the list
    // You might add actions here (e.g., reassign, cancel) if the backend supports them for admin
    const columns = [
        {
            header: 'Requester',
            cell: (request) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.requester?.first_name} {request.requester?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {request.requester?.email}
                    </div>
                </>
            ),
        },
        {
            header: 'Request Type',
            cell: (request) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.category?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {request.request_type} {request.preferred_model ? `(${request.preferred_model})` : ''}
                    </div>
                </>
            ),
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
            header: 'Current Status',
            cell: (request) => <AssetStatusBadge status={request.current_status} />,
        },
        {
            // ✅ NEW COLUMN to show the return date
            header: 'Returned On',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {request.fulfillmentAssignment?.return_date 
                        ? new Date(request.fulfillmentAssignment.return_date).toLocaleDateString() 
                        : 'N/A'
                    }
                </div>
            ),
        },
        {
            header: 'Last Approver',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {request.finalApprover ? `${request.finalApprover.first_name} ${request.finalApprover.last_name}` : 'N/A'}
                </div>
            ),
        },
        {
            header: 'Assigned For Fulfillment To',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {request.resourceAssignee ? `${request.resourceAssignee.first_name} ${request.resourceAssignee.last_name}` : 'N/A'}
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
        // Optional: Add actions for admin like "View Details", "Reassign Fulfillment", "Cancel Request"
    ];

    return (
        <AssetGenericTable
            columns={columns}
            data={data}
            noDataMessage="No IT asset requests found in the system."
        />
    );
};

export default AllAssetRequestsTable;