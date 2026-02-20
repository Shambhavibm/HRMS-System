import React from 'react';

const StatusBadge = ({ status }) => {
    const statusStyles = {
        Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        Approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
        Processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    };

    return (
        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

export default StatusBadge;