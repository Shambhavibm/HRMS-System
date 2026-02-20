
import React from 'react';
import GenericTable from './GenericTable'; // <-- Import the new component
import StatusBadge from './StatusBadge';
import { LinkIcon } from '../../../icons';

const MyClaimsHistoryTable = ({ claims }) => {
    const columns = [
        { header: 'Category', cell: (claim) => <div className="text-sm font-medium text-gray-800 dark:text-gray-100">{claim.category}</div> },
        { header: 'Amount', cell: (claim) => <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">₹{Number(claim.amount).toLocaleString()}</div> },
        { header: 'Status', cell: (claim) => <StatusBadge status={claim.status} /> },
        { header: 'Expense Date', cell: (claim) => <div className="text-sm text-gray-600 dark:text-gray-300">{new Date(claim.expense_date).toLocaleDateString()}</div> },
        { header: 'Submitted On', cell: (claim) => <div className="text-sm text-gray-600 dark:text-gray-300">{new Date(claim.created_at).toLocaleDateString()}</div> },
        {
            header: 'Receipt',
            textAlign: 'center',
            cell: (claim) => (
                <a href={`http://localhost:5000/${claim.document_path}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300">
                    <LinkIcon className="h-5 w-5 mx-auto" />
                </a>
            ),
        },
    ];

    return (
        <GenericTable
            columns={columns}
            data={claims}
            noDataMessage="No claims match the current filter criteria."
        />
    );
};

export default MyClaimsHistoryTable;