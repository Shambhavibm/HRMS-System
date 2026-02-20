
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';

import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/Input';
import Label from '../../../components/form/Label';

const ManageSalary = ({ isOpen, onClose, employee, onSuccess }) => {
    const [componentTemplates, setComponentTemplates] = useState([]);
    const [salaryData, setSalaryData] = useState({
        ctc: '',
        effective_date: new Date(),
        component_values: {},
    });
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const token = localStorage.getItem('token');

    const fetchInitialData = useCallback(async () => {
        if (!isOpen) return;
        setLoading(true);
        try {
            const componentsRes = await axios.get('/api/payroll/components', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setComponentTemplates(componentsRes.data);

            if (employee?.SalaryStructure?.structure_id) {
                const structureRes = await axios.get(`/api/payroll/structure/${employee.user_id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSalaryData({
                    ctc: structureRes.data.ctc || '',
                    effective_date: new Date(structureRes.data.effective_date),
                    component_values: structureRes.data.component_values || {},
                });
            } else {
                 setSalaryData({ ctc: '', effective_date: new Date(), component_values: {} });
            }
        } catch (error) {
            console.error('Error fetching initial salary data:', error);
            setSalaryData({ ctc: '', effective_date: new Date(), component_values: {} });
        } finally {
            setLoading(false);
        }
    }, [isOpen, employee, token]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleValueChange = (key, value) => {
        setSalaryData(prev => ({ ...prev, [key]: value }));
    };

    const handleComponentValueChange = (componentId, value) => {
        setSalaryData(prev => ({
            ...prev,
            component_values: { ...prev.component_values, [componentId]: value },
        }));
    };

    const { totalEarnings, totalDeductions, netSalary } = useMemo(() => {
        let earnings = 0, deductions = 0;
        componentTemplates.forEach(comp => {
            const value = parseFloat(salaryData.component_values[comp.component_id]) || 0;
            if (comp.type === 'earning') earnings += value;
            else if (comp.type === 'deduction') deductions += value;
        });
        return { totalEarnings: earnings, totalDeductions: deductions, netSalary: earnings - deductions };
    }, [salaryData.component_values, componentTemplates]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const payload = {
            ctc: salaryData.ctc,
            effective_date: salaryData.effective_date.toISOString().split('T')[0],
            component_values: salaryData.component_values,
        };
        try {
            await axios.post(`/api/payroll/structure/${employee.user_id}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Salary structure saved successfully!');
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save salary structure.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderDynamicSection = (title, type) => {
        const fields = componentTemplates.filter(comp => comp.type === type);
        if (fields.length === 0) return null;
        return (
            <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 border-b pb-2 mb-4">{title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(field => (
                        <div key={field.component_id}>
                            <Label htmlFor={field.name}>{field.name}</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="number"
                                placeholder="0.00"
                                value={salaryData.component_values[field.component_id] || ''}
                                // ✅ CRITICAL FIX: Ensures we use the component's ID to update the state.
                                onChange={e => handleComponentValueChange(field.component_id, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl m-4">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Manage Salary for {employee.first_name} {employee.last_name}</h3>
                {loading ? <p>Loading...</p> : (
                    <form onSubmit={handleSubmit}>
                        <div className="max-h-[60vh] overflow-y-auto pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <Label htmlFor="ctc">Annual CTC (Cost to Company) *</Label>
                                    <Input id="ctc" name="ctc" type="number" value={salaryData.ctc} onChange={e => handleValueChange('ctc', e.target.value)} required />
                                </div>
                                <div>
                                    <Label htmlFor="effective_date">Effective Date *</Label>
                                    <DatePicker selected={salaryData.effective_date} onChange={date => handleValueChange('effective_date', date)} dateFormat="dd/MM/yyyy" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm" required />
                                </div>
                            </div>
                            {renderDynamicSection('Earnings', 'earning')}
                            {renderDynamicSection('Deductions', 'deduction')}
                            {renderDynamicSection('Employer Contributions & Benefits', 'contribution')}
                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h4 className="text-lg font-bold mb-2">Monthly Salary Summary</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div><Label>Total Earnings</Label><p className="text-xl font-mono">₹{totalEarnings.toLocaleString()}</p></div>
                                    <div><Label>Total Deductions</Label><p className="text-xl font-mono text-red-500">₹{totalDeductions.toLocaleString()}</p></div>
                                    <div><Label>Net Salary</Label><p className="text-xl font-mono text-green-500">₹{netSalary.toLocaleString()}</p></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-6 pt-4 border-t dark:border-gray-700">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default ManageSalary;