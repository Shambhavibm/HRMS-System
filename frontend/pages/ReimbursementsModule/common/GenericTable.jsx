
import React from 'react';

const GenericTable = ({ columns, data, noDataMessage }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.header}
                                    scope="col"
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${col.textAlign === 'center' ? 'text-center' : 'text-left'}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.length > 0 ? (
                            data.map((item) => (
                                <tr key={item.reimbursement_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                    {columns.map((col) => (
                                        <td key={col.header} className="px-6 py-4 whitespace-nowrap">
                                            {col.cell(item)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500">
                                    {noDataMessage || 'No data available.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GenericTable;