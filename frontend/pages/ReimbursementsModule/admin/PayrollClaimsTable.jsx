
import React from 'react';
import GenericTable from '../common/GenericTable'; // <-- Import the new component
import { LinkIcon } from '../../../icons';

const PayrollClaimsTable = ({ claims }) => {
    const columns = [
        {
            header: 'Employee',
            cell: (claim) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{claim.employee.first_name} {claim.employee.last_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{claim.category}</div>
                </>
            ),
        },
        { header: 'Amount', cell: (claim) => <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">₹{Number(claim.amount).toLocaleString()}</div> },
        { header: 'Approved By', cell: (claim) => <div className="text-sm text-gray-600 dark:text-gray-300">{claim.approver.first_name} {claim.approver.last_name}</div> },
        { header: 'Approved On', cell: (claim) => <div className="text-sm text-gray-600 dark:text-gray-300">{new Date(claim.approved_at).toLocaleDateString()}</div> },
        {
            header: 'Receipt',
            textAlign: 'center',
            cell: (claim) => (
                <a href={`http://localhost:5000/${claim.document_path}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300">
                    <LinkIcon className="h-5 w-5 mx-auto" />
                </a>
            ),
        },
        {
            header: 'Action',
            textAlign: 'center',
            cell: (claim) => <button className="btn-primary-sm" disabled>Add to Payroll</button>,
        },
    ];

    return (
        <GenericTable
            columns={columns}
            data={claims}
            noDataMessage="No claims to process for the selected filters."
        />
    );
};

export default PayrollClaimsTable;