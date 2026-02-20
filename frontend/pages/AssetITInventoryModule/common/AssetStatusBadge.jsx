// AssetITInventoryModule/common/AssetStatusBadge.jsx
//This will display asset request or asset inventory statuses with appropriate styling.
import React from 'react';

const AssetStatusBadge = ({ status }) => {
    let badgeStyle = 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300'; // Default

    switch (status) {
        case 'Pending Manager Approval':
        case 'Pending Admin Approval':
        case 'Awaiting Procurement':
            badgeStyle = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
            break;
        case 'Approved':
        case 'Fulfilled':
        case 'Available':
        case 'Issued':
        case 'Cleared': // For exit flow
            badgeStyle = 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
            break;
        case 'Rejected':
        case 'Cancelled':
        case 'Lost':
        case 'Damaged':
            badgeStyle = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            break;
        case 'Under Repair':
            badgeStyle = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
            break;
        case 'Awaiting Disposal':
        case 'Retired':
            badgeStyle = 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
            break;
        default:
            break;
    }

    return (
        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${badgeStyle}`}>
            {status}
        </span>
    );
};

export default AssetStatusBadge;