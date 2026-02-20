
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PlusCircle, Trash2 } from 'lucide-react';

import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/Input';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import { Modal } from '../../../components/ui/modal';
import { useModal } from '../../../hooks/useModal';

const SalaryComponents = () => {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, openModal, closeModal } = useModal();
    const [newComponent, setNewComponent] = useState({ name: '', type: 'earning' });

    const token = localStorage.getItem('token');

    const fetchComponents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/payroll/components', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComponents(response.data);
        } catch (error) {
            toast.error('Failed to fetch salary components.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchComponents();
    }, [fetchComponents]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newComponent.name || !newComponent.type) {
            toast.info('Please provide a name and type.');
            return;
        }
        try {
            await axios.post('/api/payroll/components', newComponent, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Component created successfully.');
            setNewComponent({ name: '', type: 'earning' });
            closeModal();
            fetchComponents();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create component.');
        }
    };

    const handleDelete = async (componentId) => {
        if (window.confirm('Are you sure you want to delete this component? This action cannot be undone.')) {
            try {
                await axios.delete(`/api/payroll/components/${componentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Component deleted successfully.');
                fetchComponents();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete component.');
            }
        }
    };

    return (
        <>
            <PageMeta title="Salary Components | VipraGo" />
            <PageBreadcrumb pageTitle="Salary Component Settings" />

            <ComponentCard>
                {/* --- HEADER WITH TITLE AND BUTTON --- */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Manage Salary Components
                    </h3>
                    <Button onClick={openModal} startIcon={<PlusCircle size={18} />}>
                        Add Component
                    </Button>
                </div>
                
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400 border-t pt-4 dark:border-gray-700">
                    Define the building blocks for your organization's salary structures. These will appear in the salary management form.
                </p>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="3" className="text-center py-4">Loading...</td></tr>
                            ) : components.length === 0 ? (
                                <tr><td colSpan="3" className="text-center py-6 text-gray-500">No components created yet. Click "Add Component" to begin.</td></tr>
                            ) : (
                                components.map(comp => (
                                    <tr key={comp.component_id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{comp.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap capitalize">{comp.type}</td>
                                        <td className="px-6 py-4 text-center">
                                            {!comp.is_system_defined && (
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(comp.component_id)} iconOnly>
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </ComponentCard>

            <Modal isOpen={isOpen} onClose={closeModal} title="Create New Salary Component">
                <form onSubmit={handleCreate} className="space-y-4 p-1">
                    <div>
                        <Label htmlFor="name">Component Name</Label>
                        <Input
                            id="name"
                            value={newComponent.name}
                            onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                            placeholder="e.g., Performance Bonus"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="type">Component Type</Label>
                        <Select
                            id="type"
                            value={newComponent.type}
                            onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value })}
                        >
                            <option value="earning">Earning</option>
                            <option value="deduction">Deduction</option>
                            <option value="contribution">Employer Contribution</option>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                        <Button type="submit">Create Component</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default SalaryComponents;