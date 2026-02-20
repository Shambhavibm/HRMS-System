// frontend/pages/AssetITInventoryModule/manager/TeamAssetApprovalsList.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AssetDashboardTemplate from '../common/AssetDashboardTemplate';
import AssetGenericTable from '../common/AssetGenericTable';
import AssetStatusBadge from '../common/AssetStatusBadge';
import { LinkIcon } from '../../../icons';

const TeamAssetApprovalsList = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleAction = async (requestId, actionType, reason = null) => {
        setIsModalOpen(false);
        const toastId = toast.loading(`Processing request...`);

        try {
            const token = localStorage.getItem('token');
            let response;
            if (actionType === 'approve') {
                // The corrected URL
                response = await axios.post(`/api/assets/requests/approve/${requestId}`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else if (actionType === 'reject') {
                if (!reason || !reason.trim()) {
                    toast.error("Rejection reason cannot be empty.", { id: toastId });
                    return;
                }
                response = await axios.post(`/api/assets/requests/reject/${requestId}`, { reason }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            toast.success(response.data.message || `Request ${actionType}d successfully!`, { id: toastId });
            setRejectionReason('');
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${actionType} request.`, { id: toastId });
            console.error(`Error ${actionType}ing asset request:`, error);
        }
    };

    const openRejectModal = (requestId) => {
        setSelectedRequestId(requestId);
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: 'Requester',
            cell: (request) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.requester?.first_name} {request.requester?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {request.requester?.official_email_id}
                    </div>
                </>
            ),
        },
        {
            header: 'Request',
            cell: (request) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.category?.name || 'N/A'} - {request.request_type}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {request.preferred_model ? `Pref: ${request.preferred_model}` : ''}
                    </div>
                </>
            ),
        },
        {
            header: 'Justification',
            cell: (request) => (
                <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={request.justification}>
                    {request.justification}
                </div>
            ),
        },
        {
            header: 'Urgency',
            cell: (request) => <div className="text-sm text-gray-600 dark:text-gray-300">{request.urgency}</div>,
        },
        {
            header: 'Submitted On',
            cell: (request) => <div className="text-sm text-gray-600 dark:text-gray-300">{new Date(request.created_at).toLocaleDateString()}</div>,
        },
        {
            header: 'Status',
            cell: (request) => <AssetStatusBadge status={request.current_status} />,
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
        {
            header: 'Actions',
            textAlign: 'center',
            cell: (request) => (
                <div className="flex justify-center space-x-2">
                    <button onClick={() => handleAction(request.request_id, 'approve')} className="btn-success-sm">Approve</button>
                    <button onClick={() => openRejectModal(request.request_id)} className="btn-danger-outline-sm">Reject</button>
                </div>
            ),
        },
    ];

    return (
        <>
            <AssetDashboardTemplate
                key={refreshTrigger}
                fetchUrl="/api/assets/requests/pending-approvals"
                listTitle="Pending IT Asset Requests for My Team"
            >
                {({ data, isLoading: dataLoading }) => {
                    if (dataLoading) {
                        return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading pending approvals...</div>;
                    }

                    return (
                        <AssetGenericTable
                            columns={columns}
                            data={data || []}
                            noDataMessage="You have no pending IT asset requests to review."
                        />
                    );
                }}
            </AssetDashboardTemplate>

            {/* Rejection Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md scale-95 hover:scale-100 transition-transform duration-300">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Reason for Rejection</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full input-style"
                            rows="4"
                            placeholder="Provide a clear reason for rejecting this asset request..."
                        />
                        <div className="mt-4 flex justify-end space-x-3">
                            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button onClick={() => handleAction(selectedRequestId, 'reject', rejectionReason)} className="btn-danger">Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TeamAssetApprovalsList;