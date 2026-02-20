import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Input from '../../../components/form/input/Input';
import Button from '../../../components/ui/button/Button'; // Assuming this Button component is available
import Label from "../../../components/form/Label";
import { Modal } from "../../../components/ui/modal";
import { Edit, Search } from 'lucide-react'; // Import Search icon for consistency

const AdminCostHistory = ({ token, isActive }) => {
    const [costHistory, setCostHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingEntry, setEditingEntry] = useState(null);
    const [editFormData, setEditFormData] = useState({
        item_name: '',
        category: '',
        amount: '',
        description: ''
    });

    // Function to fetch cost history
    const fetchCostHistory = async () => {
        try {
            const res = await axios.get('/api/cost-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Add a _visible property for filtering, though it's currently unused in the filter logic
            setCostHistory(res.data.map(entry => ({ ...entry, _visible: true })));
        } catch (err) {
            console.error("Failed to fetch cost history:", err);
            // Using toast for consistency if available, otherwise a simple alert
            // toast.error("Failed to fetch cost history.");
            console.error('Failed to fetch cost history!');
        }
    };

    // Effect hook to fetch data when component is active or token changes
    useEffect(() => {
        if (isActive) {
            fetchCostHistory();
        }
    }, [token, isActive]);

    // Filter cost history based on search term
    const filteredCostHistory = costHistory.filter(entry => {
        const lower = searchTerm.toLowerCase();
        return (
            // entry._visible && // This property is not being used in the current filter logic
            (entry.project_name?.toLowerCase().includes(lower) ||
                String(entry.cost_id).includes(lower) ||
                entry.item_name?.toLowerCase().includes(lower) ||
                entry.category?.toLowerCase().includes(lower) ||
                entry.description?.toLowerCase().includes(lower))
        );
    });

    // Open the edit modal and populate form data
    const openEditModal = (entry) => {
        setEditingEntry(entry);
        setEditFormData({
            item_name: entry.item_name,
            category: entry.category,
            amount: entry.amount,
            description: entry.description || ''
        });
    };

    // Handle changes in the edit form
    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    // Handle submission of the edit form
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedEntry = { ...editingEntry, ...editFormData };
            await axios.put(`/api/projects/${editingEntry.cost_id}/cost-entry`, updatedEntry, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCostHistory(); // Refresh data after successful update
            setEditingEntry(null); // Close the modal
            // Using toast for consistency if available, otherwise a simple alert
            // toast.success('Cost entry updated successfully!');
            console.log('Cost entry updated successfully!');
        } catch (err) {
            console.error("Failed to update cost entry:", err);
            // Using toast for consistency if available, otherwise a simple alert
            // toast.error('Failed to update cost entry!');
            console.error('Failed to update cost entry!');
        }
    };

    return (
        <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
            <div className="mb-6 flex items-center justify-between">
                {/* Changed text-gray-800 to text-black and added dark:text-white */}
                <h2 className="text-xl font-bold text-black dark:text-white">Cost History</h2>
                <div className="w-full max-w-xs"> {/* Adjusted width for consistency */}
                    <Input
                        type="text"
                        placeholder="Search by project name, item, category or cost ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        startIcon={<Search size={16} />} // Added Search icon
                    />
                </div>
            </div>

            {filteredCostHistory.length === 0 ? (
                <p className="text-gray-600 italic dark:text-gray-400">No matching cost entries found.</p>
            ) : (
                <div className="overflow-x-auto"> {/* Changed to overflow-x-auto for horizontal scrolling */}
                    <table className="min-w-full bg-white dark:bg-gray-800"> {/* Removed border from table, added bg */}
                        <thead className="bg-gray-100 dark:bg-gray-700"> {/* Consistent header styling */}
                            <tr>
                                {/* Adjusted padding, text alignment, and font styles for headers */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700"> {/* Consistent body styling */}
                            {filteredCostHistory.map(entry => (
                                <tr
                                    key={entry.cost_id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200" // Added font style and color
                                >
                                    {/* Adjusted padding and whitespace for cells */}
                                    <td className="px-6 py-4 whitespace-nowrap">{entry.cost_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{entry.project_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{entry.item_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{entry.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">₹{Number(entry.amount).toLocaleString()}</td> {/* Formatted amount */}
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(entry.added_on).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <Button
                                            size="sm" // Using the Button component with size prop
                                            onClick={() => openEditModal(entry)}
                                            startIcon={<Edit size={16} />} // Added Edit icon
                                        >
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            <Modal isOpen={!!editingEntry} onClose={() => setEditingEntry(null)} className="max-w-md">
                <div className="relative w-full overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white/90">Edit Cost Entry</h2>

                    <form onSubmit={handleEditSubmit} className="space-y-3">
                        <Label htmlFor="item_name">Item Name</Label>
                        <Input
                            id="item_name"
                            name="item_name"
                            value={editFormData.item_name}
                            onChange={handleEditChange}
                        />

                        <Label htmlFor="category">Category</Label>
                        <Input
                            id="category"
                            name="category"
                            value={editFormData.category}
                            onChange={handleEditChange}
                        />

                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            value={editFormData.amount}
                            onChange={handleEditChange}
                        />

                        <Label htmlFor="description">Description</Label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            className="w-full border border-gray-300 mb-3 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={editFormData.description}
                            onChange={handleEditChange}
                        />

                        <div className="flex justify-end gap-3">
                            <Button variant="outline" type="button" onClick={() => setEditingEntry(null)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default AdminCostHistory;
