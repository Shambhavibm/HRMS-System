// frontend/pages/AssetITInventoryModule/member/MyAssetsTable.jsx
import React from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AssetGenericTable from '../common/AssetGenericTable';
import AssetStatusBadge from '../common/AssetStatusBadge';
import { CheckBadgeIcon } from '../../../icons'; // Assuming you have a check badge icon

const MyAssetsTable = ({ data, refreshData }) => {
    const handleAcknowledgeReceipt = async (assignmentId) => {
        const toastId = toast.loading("Acknowledging receipt...");
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/assets/assignments/acknowledge/${assignmentId}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Asset receipt acknowledged!", { id: toastId });
            if (refreshData) {
                refreshData(); // Refresh the list to update the status and remove the button
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to acknowledge.", { id: toastId });
            console.error("Acknowledgment error:", error);
        }
    };

    const columns = [
        {
            header: 'Asset',
            cell: (assignment) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {assignment.asset?.manufacturer} {assignment.asset?.model}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {assignment.asset?.category?.name} - S/N: {assignment.asset?.serial_number}
                    </div>
                </>
            ),
        },
        {
            header: 'Assigned On',
            cell: (assignment) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(assignment.assignment_date).toLocaleDateString()}
                </div>
            ),
        },
        {
            header: 'Status',
            cell: (assignment) => <AssetStatusBadge status={assignment.asset?.current_status} />,
        },
        {
            header: 'Actions',
            textAlign: 'center',
            cell: (assignment) => (
                // ✅ This is the new logic for the button
                assignment.asset?.current_status === 'Issued' ? (
                    <button
                        onClick={() => handleAcknowledgeReceipt(assignment.assignment_id)}
                        className="btn-primary-sm flex items-center justify-center mx-auto"
                    >
                        <CheckBadgeIcon className="w-4 h-4 mr-2" />
                        Acknowledge Receipt
                    </button>
                ) : (
                    // Once acknowledged (or in any other state), show nothing or a confirmation
                    <div className="flex items-center justify-center text-green-600">
                        <CheckBadgeIcon className="w-5 h-5" />
                    </div>
                )
            ),
        },
    ];

    return (
        <AssetGenericTable
            columns={columns}
            data={data}
            noDataMessage="No IT assets currently assigned to you."
        />
    );
};

export default MyAssetsTable;