// frontend/pages/AssetITInventoryModule/admin/AssetClearanceList.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AssetDashboardTemplate from '../common/AssetDashboardTemplate';
import AssetGenericTable from '../common/AssetGenericTable';
import AssetStatusBadge from '../common/AssetStatusBadge';
import { UserRemoveIcon, LoaderIcon } from '../../../icons';

const AssetClearanceList = () => {
    // --- State Management ---
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [returnProcessData, setReturnProcessData] = useState({});
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const assetConditionOptions = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];
    const postReturnAssetStatusOptions = ['Available', 'Under Repair', 'Awaiting Disposal', 'Retired'];
    const signOffStatusOptions = ['Cleared', 'Cleared with Issues', 'Pending Compensation'];

    // --- Logic Functions ---
    const openReturnModal = (assignment) => {
        setSelectedAssignment(assignment);
        setReturnProcessData({
            return_date: new Date().toISOString().slice(0, 10),
            returned_condition: assignment.asset?.condition || '',
            new_asset_status: '',
            damage_notes: '',
            sign_off_status: '',
            notes: assignment.notes || '',
        });
        setIsReturnModalOpen(true);
    };

    const handleReturnChange = (e) => {
        setReturnProcessData({ ...returnProcessData, [e.target.name]: e.target.value });
    };

    const handleProcessReturn = async (e) => {
        e.preventDefault();
        setIsLoadingAction(true);
        if (!returnProcessData.returned_condition || !returnProcessData.new_asset_status || !returnProcessData.sign_off_status) {
            toast.error("Please fill all required fields: Condition, New Status, and Sign-Off Status.");
            setIsLoadingAction(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/assets/clearance/process-return/${selectedAssignment.assignment_id}`, returnProcessData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Asset return processed successfully!");
            setIsReturnModalOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to process asset return.");
            console.error("Error processing asset return:", error);
        } finally {
            setIsLoadingAction(false);
        }
    };


    const columns = [
        {
            header: 'Employee',
            cell: (assignment) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {assignment.assignee?.first_name} {assignment.assignee?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {assignment.assignee?.official_email_id}
                    </div>
                </>
            ),
        },
        {
            header: 'Asset Details',
            cell: (assignment) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {assignment.asset?.manufacturer} {assignment.asset?.model}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        S/N: {assignment.asset?.serial_number}
                    </div>
                </>
            ),
        },
        {
            header: 'Asset Status',
            cell: (assignment) => <AssetStatusBadge status={assignment.asset?.current_status} />,
        },
        {
            header: 'Clearance Status',
            cell: (assignment) => (
                assignment.is_active 
                    ? <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">Awaiting Return</span>
                    : <AssetStatusBadge status={assignment.sign_off_status || 'Returned'} />
            ),
        },
        {
            header: 'Actions',
            textAlign: 'center',
            cell: (assignment) => (
                assignment.is_active ? (
                    <button onClick={() => openReturnModal(assignment)} className="btn-primary-sm flex items-center justify-center mx-auto">
                        <UserRemoveIcon className="w-4 h-4 mr-1" /> Process Return
                    </button>
                ) : (
                    <span className="text-gray-400 text-xs italic">Processed</span>
                )
            ),
        },
    ];

    return (
        <>
            <AssetDashboardTemplate
                key={refreshTrigger}
                fetchUrl="/api/assets/clearance/pending"
                listTitle="Asset Clearance Management"
                showCategoryFilter={true}
            >
                {(props) => {
                    if (!props) return <div className="p-8 text-center text-red-500">Error: Data not provided.</div>;
                    const { data, isLoading: dataLoading } = props;
                    if (dataLoading) return <div className="p-8 text-center text-gray-500">Loading clearance requests...</div>;
                    if (!Array.isArray(data)) return <div className="p-8 text-center text-red-500">Error: Invalid data format.</div>;

                    return (
                        <AssetGenericTable
                            columns={columns}
                            data={data}
                            noDataMessage="No active asset assignments found to be cleared."
                        />
                    );
                }}
            </AssetDashboardTemplate>

            {/* Process Return Modal with new fields */}
            {isReturnModalOpen && selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Process Asset Return</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 border-l-4 border-gray-300 pl-4">
                            <b>Asset:</b> {selectedAssignment.asset?.manufacturer} {selectedAssignment.asset?.model} (S/N: {selectedAssignment.asset?.serial_number})<br/>
                            <b>Assigned to:</b> {selectedAssignment.assignee?.first_name} {selectedAssignment.assignee?.last_name}
                        </p>
                        <form onSubmit={handleProcessReturn} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="return_date" className="form-label">Return Date *</label>
                                    <input type="date" id="return_date" name="return_date" value={returnProcessData.return_date} onChange={handleReturnChange} required className="input-style" />
                                </div>
                                <div>
                                    <label htmlFor="returned_condition" className="form-label">Returned Condition *</label>
                                    <select id="returned_condition" name="returned_condition" value={returnProcessData.returned_condition} onChange={handleReturnChange} required className="input-style">
                                        <option value="">Select condition...</option>
                                        {assetConditionOptions.map(condition => <option key={condition} value={condition}>{condition}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="new_asset_status" className="form-label">New Asset Status (Post-Return) *</label>
                                <select id="new_asset_status" name="new_asset_status" value={returnProcessData.new_asset_status} onChange={handleReturnChange} required className="input-style">
                                    <option value="">Select new status...</option>
                                    {postReturnAssetStatusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="damage_notes" className="form-label">Damage Assessment & Notes</label>
                                <textarea id="damage_notes" name="damage_notes" rows="3" value={returnProcessData.damage_notes} onChange={handleReturnChange} className="input-style"
                                    placeholder="Detail any damages, missing items, or reasons for compensation here."
                                ></textarea>
                            </div>
                            <div>
                                <label htmlFor="sign_off_status" className="form-label">Final Sign-Off Status *</label>
                                <select id="sign_off_status" name="sign_off_status" value={returnProcessData.sign_off_status} onChange={handleReturnChange} required className="input-style">
                                    <option value="">Select clearance status...</option>
                                    {signOffStatusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button type="button" onClick={() => setIsReturnModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={isLoadingAction} className="btn-primary">
                                    {isLoadingAction ? (
                                        <div className="flex items-center space-x-2"><LoaderIcon className="animate-spin w-5 h-5" /><span>Processing...</span></div>
                                    ) : (
                                        'Confirm Return & Sign-Off'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AssetClearanceList;