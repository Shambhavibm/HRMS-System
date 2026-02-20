
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../../components/ui/accordion';

const DataField = ({ label, value, isCurrency = true }) => (
    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 dark:text-white">
            {isCurrency ? `₹${Number(value || 0).toLocaleString()}` : (value || 'N/A')}
        </p>
    </div>
);

const ViewSalary = ({ salaryData }) => {
    const [componentTemplates, setComponentTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const parsedComponentValues = useMemo(() => {
        if (!salaryData?.component_values) return {};
        if (typeof salaryData.component_values === 'string') {
            try { return JSON.parse(salaryData.component_values); } catch (e) { return {}; }
        }
        return salaryData.component_values;
    }, [salaryData]);

    const fetchComponentTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/payroll/components', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComponentTemplates(response.data);
        } catch (error) {
            console.error('Failed to fetch component templates:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (salaryData) {
            fetchComponentTemplates();
        } else {
            setLoading(false);
        }
    }, [salaryData, fetchComponentTemplates]);
    
    const { totalEarnings, totalDeductions, netSalary } = useMemo(() => {
        if (!parsedComponentValues || !componentTemplates.length) return { totalEarnings: 0, totalDeductions: 0, netSalary: 0 };
        let earnings = 0, deductions = 0;
        for (const comp of componentTemplates) {
            const value = parseFloat(parsedComponentValues[comp.component_id]) || 0;
            if (comp.type === 'earning') earnings += value;
            else if (comp.type === 'deduction') deductions += value;
        }
        return { totalEarnings: earnings, totalDeductions: deductions, netSalary: earnings - deductions };
    }, [parsedComponentValues, componentTemplates]);

    const revisionHistory = useMemo(() => {
        if (!salaryData?.revision_history) return [];
        if (typeof salaryData.revision_history === 'string') {
            try { return JSON.parse(salaryData.revision_history); } catch (e) { return []; }
        }
        return Array.isArray(salaryData.revision_history) ? salaryData.revision_history : [];
    }, [salaryData]);

    const renderDynamicSection = (title, type) => {
        const fields = componentTemplates.filter(comp => comp.type === type);
        if (!parsedComponentValues || fields.length === 0) return null;
        return (
            <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-3">{title}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {fields.map(field => (
                        <DataField key={field.component_id} label={field.name} value={parsedComponentValues[field.component_id] || 0} />
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Details...</div>;
    if (!salaryData) return <div className="text-center p-8 text-gray-500">No salary structure has been defined.</div>;

    return (
        <div className="p-1 md:p-2 space-y-6">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-blue-600 dark:text-blue-300">Annual CTC</p>
                        <p className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-200">₹{Number(salaryData.ctc).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-right">Effective From</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{new Date(salaryData.effective_date).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
            {renderDynamicSection("Monthly Earnings", "earning")}
            {renderDynamicSection("Monthly Deductions", "deduction")}
            {renderDynamicSection("Employer Contributions & Benefits", "contribution")}
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <h4 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">Monthly Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div><p className="text-sm text-gray-500">Total Earnings</p><p className="text-xl font-semibold text-green-600">₹{totalEarnings.toLocaleString()}</p></div>
                    <div><p className="text-sm text-gray-500">Total Deductions</p><p className="text-xl font-semibold text-red-600">₹{totalDeductions.toLocaleString()}</p></div>
                    <div><p className="text-sm text-gray-500">Net Salary</p><p className="text-xl font-bold text-gray-900 dark:text-white">₹{netSalary.toLocaleString()}</p></div>
                </div>
            </div>
            {revisionHistory.length > 0 && (
                <div className="mt-6">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>View Revision History</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    {revisionHistory.slice().reverse().map((rev, index) => (
                                        <div key={index} className="text-sm p-2 border-b dark:border-gray-700">
                                            <p><strong>CTC:</strong> ₹{Number(rev.ctc).toLocaleString()}</p>
                                            <p><strong>Effective Date:</strong> {new Date(rev.effective_date).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-500">Revision recorded on: {rev.updated_at_revision ? new Date(rev.updated_at_revision).toLocaleString() : 'N/A'}</p>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            )}
        </div>
    );
};

export default ViewSalary;