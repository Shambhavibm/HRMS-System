// frontend/pages/AssetITInventoryModule/admin/AssignedFulfillmentList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AssetDashboardTemplate from '../common/AssetDashboardTemplate';
import AssetGenericTable from '../common/AssetGenericTable';
import AssetStatusBadge from '../common/AssetStatusBadge';
import { CheckCircleIcon, ShoppingBagIcon, LoaderIcon, LocationMarkerIcon } from '../../../icons';

const AssignedFulfillmentList = () => {
    // --- State Management ---
    const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [availableSerializedAssets, setAvailableSerializedAssets] = useState([]);
    const [availableBulkStock, setAvailableBulkStock] = useState([]);

    const [fulfillmentData, setFulfillmentData] = useState({
        asset_id: '',
        stock_id: '',
        assignment_date: new Date().toISOString().slice(0, 10),
        accessory_details: '',
        notes: '',
    });

    // Fetches available inventory when the fulfillment modal opens
    useEffect(() => {
        if (isFulfillModalOpen && selectedRequest) {
            const fetchAvailableItems = async () => {
                const token = localStorage.getItem('token');
                const trackingType = selectedRequest.category?.tracking_type;
                const locationId = selectedRequest.location_id;

                if (!locationId) {
                    toast.error("Request is missing a location. Cannot fetch inventory.");
                    return;
                }

                try {
                    if (trackingType === 'Serialized') {
                        const response = await axios.get('/api/assets/inventory/all', { headers: { 'Authorization': `Bearer ${token}` } });
                        const filteredAssets = response.data.filter(asset =>
                            asset.current_status === 'Available' &&
                            asset.category_id === selectedRequest.category_id &&
                            asset.location_id === locationId
                        );
                        setAvailableSerializedAssets(filteredAssets);
                        setAvailableBulkStock([]);
                    } else if (trackingType === 'Bulk') {
                        const response = await axios.get('/api/assets/inventory/stock', { headers: { 'Authorization': `Bearer ${token}` } });
                        const filteredStock = response.data.filter(stock =>
                            stock.available_quantity > 0 &&
                            stock.category_id === selectedRequest.category_id &&
                            stock.location_id === locationId
                        );
                        setAvailableBulkStock(filteredStock);
                        setAvailableSerializedAssets([]);
                    }
                } catch (error) {
                    toast.error("Failed to fetch available inventory for the selected location.");
                    console.error("Error fetching available items:", error);
                }
            };
            fetchAvailableItems();
        }
    }, [isFulfillModalOpen, selectedRequest]);

    const openFulfillModal = (request) => {
        setSelectedRequest(request);
        setFulfillmentData({
            asset_id: '',
            stock_id: '',
            assignment_date: new Date().toISOString().slice(0, 10),
            accessory_details: '',
            notes: '',
        });
        setIsFulfillModalOpen(true);
    };

    const handleFulfillmentChange = (e) => {
        setFulfillmentData({ ...fulfillmentData, [e.target.name]: e.target.value });
    };

    const handleFulfillSubmit = async (e) => {
        e.preventDefault();
        setIsLoadingAction(true);

        const isSerialized = selectedRequest.category?.tracking_type === 'Serialized';
        
        const payload = {
            assignment_date: fulfillmentData.assignment_date,
            notes: fulfillmentData.notes,
            asset_id: isSerialized ? fulfillmentData.asset_id : null,
            stock_id: !isSerialized ? fulfillmentData.stock_id : null,
            // CORRECTLY formats accessory details into a JSON string for the backend.
            accessory_details: (isSerialized && fulfillmentData.accessory_details)
                ? JSON.stringify({ charger_serial: fulfillmentData.accessory_details })
                : null
        };
        
        if (isSerialized && !payload.asset_id) {
            toast.error("Please select a specific asset to assign.");
            setIsLoadingAction(false);
            return;
        }
        if (!isSerialized && !payload.stock_id) {
            toast.error("Please select a stock source to assign from.");
            setIsLoadingAction(false);
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/assets/requests/fulfill/${selectedRequest.request_id}`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Asset request fulfilled successfully!");
            setIsFulfillModalOpen(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fulfill request.");
            console.error("Error fulfilling request:", error);
        } finally {
            setIsLoadingAction(false);
        }
    };

    const handleMarkAwaitingProcurement = async (requestId) => {
        setIsLoadingAction(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/assets/requests/mark-awaiting-procurement/${requestId}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success("Request marked as 'Awaiting Procurement'.");
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to mark for procurement.");
            console.error("Error marking awaiting procurement:", error);
        } finally {
            setIsLoadingAction(false);
        }
    };

    const columns = [
        {
            header: 'Request Details',
            cell: (request) => (
                <>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.category?.name || 'N/A'} ({request.category?.tracking_type || 'N/A'})
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        For: {request.requester?.first_name} {request.requester?.last_name}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <LocationMarkerIcon className="w-3 h-3 mr-1.5" />
                        {request.OfficeLocation?.name || 'Location not specified'}
                    </div>
                </>
            ),
        },
        {
            header: 'Justification',
            cell: (request) => <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={request.justification}>{request.justification}</div>,
        },
        {
            header: 'Status',
            cell: (request) => <AssetStatusBadge status={request.current_status} />,
        },
        {
            header: 'Approved By',
            cell: (request) => <div className="text-sm text-gray-600 dark:text-gray-300">{request.finalApprover ? `${request.finalApprover.first_name} ${request.finalApprover.last_name}` : 'N/A'}</div>,
        },
        {
            header: 'Actions',
            textAlign: 'center',
            cell: (request) => (
                <div className="flex flex-col items-center space-y-2">
                    {['Approved', 'Awaiting Procurement'].includes(request.current_status) && (
                        <button onClick={() => openFulfillModal(request)} className="btn-success-sm w-36 flex items-center justify-center">
                            <CheckCircleIcon className="w-4 h-4 mr-2" /> Fulfill
                        </button>
                    )}
                    {['Approved'].includes(request.current_status) && (
                        <button onClick={() => handleMarkAwaitingProcurement(request.request_id)} className="btn-secondary-sm w-36 flex items-center justify-center">
                            <ShoppingBagIcon className="w-4 h-4 mr-2" /> Needs Purchase
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <AssetDashboardTemplate
                key={refreshTrigger}
                fetchUrl="/api/assets/requests/assigned-for-fulfillment"
                listTitle="IT Asset Requests for Fulfillment"
                showCategoryFilter={true}
                showStatusFilter={true}
            >
                {(props) => {
                    if (!props) return <div className="p-8 text-center text-red-500">Error: Data not provided.</div>;
                    const { data, isLoading: dataLoading } = props;
                    if (dataLoading) return <div className="p-8 text-center text-gray-500">Loading fulfillment tasks...</div>;
                    if (!Array.isArray(data)) return <div className="p-8 text-center text-red-500">Error: Invalid data format received.</div>;
                    return (
                        <AssetGenericTable
                            columns={columns}
                            data={data}
                            noDataMessage="No asset requests are currently assigned for fulfillment."
                        />
                    );
                }}
            </AssetDashboardTemplate>

            {isFulfillModalOpen && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Fulfill Asset Request</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 border-l-4 border-gray-300 pl-4">
                            <b>Requester:</b> {selectedRequest.requester?.first_name} {selectedRequest.requester?.last_name}<br/>
                            <b>Location:</b> {selectedRequest.OfficeLocation?.name}<br/>
                            <b>Requested:</b> {selectedRequest.category?.name} ({selectedRequest.category?.tracking_type})
                        </p>
                        <form onSubmit={handleFulfillSubmit} className="space-y-4">
                            {selectedRequest.category?.tracking_type === 'Serialized' ? (
                                <>
                                    <div>
                                        <label htmlFor="asset_id" className="form-label">Select Specific Asset *</label>
                                        <select id="asset_id" name="asset_id" value={fulfillmentData.asset_id} onChange={handleFulfillmentChange} required className="input-style">
                                            <option value="">Select an available asset...</option>
                                            {availableSerializedAssets.length > 0 ? availableSerializedAssets.map(asset => (
                                                <option key={asset.asset_id} value={asset.asset_id}>
                                                    {asset.manufacturer} {asset.model} (S/N: {asset.serial_number || 'N/A'})
                                                </option>
                                            )) : <option disabled>No available serialized assets found for this category/location.</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="accessory_details" className="form-label">Accessory Details (e.g., Charger S/N)</label>
                                        <input type="text" id="accessory_details" name="accessory_details" value={fulfillmentData.accessory_details} onChange={handleFulfillmentChange} className="input-style" placeholder="e.g., Charger S/N: C02XYZ123" />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label htmlFor="stock_id" className="form-label">Select Stock Source *</label>
                                    <select id="stock_id" name="stock_id" value={fulfillmentData.stock_id} onChange={handleFulfillmentChange} required className="input-style">
                                        <option value="">Select from available stock...</option>
                                        {availableBulkStock.length > 0 ? availableBulkStock.map(stock => (
                                            <option key={stock.stock_id} value={stock.stock_id}>
                                                {stock.name} (Available: {stock.available_quantity})
                                            </option>
                                        )) : <option disabled>No bulk stock found for this category/location.</option>}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label htmlFor="assignment_date" className="form-label">Assignment Date *</label>
                                <input type="date" id="assignment_date" name="assignment_date" value={fulfillmentData.assignment_date} onChange={handleFulfillmentChange} required className="input-style" />
                            </div>
                            <div>
                                <label htmlFor="notes" className="form-label">Assignment Notes (Optional)</label>
                                <textarea id="notes" name="notes" rows="3" value={fulfillmentData.notes} onChange={handleFulfillmentChange} className="input-style" placeholder="e.g., Tracking number, delivery details..."></textarea>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsFulfillModalOpen(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={isLoadingAction} className="btn-primary">
                                    {isLoadingAction ? 'Fulfilling...' : 'Confirm Fulfillment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AssignedFulfillmentList;