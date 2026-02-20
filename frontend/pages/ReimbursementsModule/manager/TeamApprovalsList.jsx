
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Pagination from '../../PayrollManagementModule/common/Pagination';
import InfoField from '../common/InfoField'; // Fixed: Added missing import

const TeamApprovalsList = () => {
    const [pendingClaims, setPendingClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedClaimId, setSelectedClaimId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const claimsPerPage = 10;

    const fetchPendingClaims = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/reimbursements/pending-approvals', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPendingClaims(response.data);
        } catch (error) {
            toast.error("Failed to fetch pending approvals.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingClaims();
    }, [fetchPendingClaims]);

    const handleApprove = async (claimId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/reimbursements/approve/${claimId}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Claim Approved!");
            fetchPendingClaims(); // Refresh the list
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to approve claim.");
        }
    };

    const openRejectModal = (claimId) => {
        setSelectedClaimId(claimId);
        setIsModalOpen(true);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Rejection reason cannot be empty.");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/reimbursements/reject/${selectedClaimId}`, { reason: rejectionReason }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Claim Rejected!");
            setIsModalOpen(false);
            setRejectionReason('');
            fetchPendingClaims(); // Refresh the list
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reject claim.");
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(pendingClaims.length / claimsPerPage);
    const currentClaims = pendingClaims.slice((currentPage - 1) * claimsPerPage, currentPage * claimsPerPage);

    // Fixed: Re-introduced the loading state for better UX
    if (isLoading) {
        return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading pending approvals...</div>;
    }

    return (
        <div>
            {currentClaims.length > 0 ? (
                <div className="space-y-4">
                    {currentClaims.map((claim) => (
                        <div key={claim.reimbursement_id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                                <div>
                                    <p className="font-semibold text-lg text-gray-800 dark:text-white">{claim.employee.first_name} {claim.employee.last_name}</p>
                                    <p className="text-gray-600 dark:text-gray-300">{claim.category}</p>
                                    <p className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">₹{Number(claim.amount).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                                    <button onClick={() => openRejectModal(claim.reimbursement_id)} className="btn-danger-outline">Reject</button>
                                    <button onClick={() => handleApprove(claim.reimbursement_id)} className="btn-success">Approve</button>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Fixed: Corrected typo from toLocaleDate-String to toLocaleDateString */}
                                <InfoField label="Expense Date" value={new Date(claim.expense_date).toLocaleDateString()} />
                                <InfoField label="Submitted On" value={new Date(claim.created_at).toLocaleDateString()} />
                                <InfoField label="Receipt">
                                    <a href={`http://localhost:5000/${claim.document_path}`} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline font-medium">
                                        View Document
                                    </a>
                                </InfoField>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-500 dark:border-gray-600">
                    <p className="font-semibold">All Clear!</p>
                    <p className="text-sm">You have no pending reimbursement claims to review.</p>
                </div>
            )}
            
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {/* Fixed: This modal is now correctly placed within the component's returned JSX */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Rejection Reason</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full input-style"
                            rows="4"
                            placeholder="Provide a clear reason for rejection..."
                        />
                        <div className="mt-4 flex justify-end space-x-2">
                            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                            <button onClick={handleReject} className="btn-danger">Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamApprovalsList;