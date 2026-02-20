// frontend/pages/AssetITInventoryModule/common/AssetGenericTable.jsx
import React from 'react';

const AssetGenericTable = ({ columns, data, noDataMessage }) => {
    // A helper function to find the first available unique ID from a data item
    const getUniqueKey = (item) => {
        return item.request_id || item.asset_id || item.assignment_id || item.category_id || item.stock_id || item.location_id || Math.random();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-b-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={col.header || index}
                                    scope="col"
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${col.textAlign === 'center' ? 'text-center' : 'text-left'}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data && data.length > 0 ? (
                            data.map((item) => {
                                // ✅ FIX: Use the new helper function to get a truly unique key for the row
                                const rowKey = getUniqueKey(item);

                                return (
                                    <tr key={rowKey} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                        {columns.map((col, colIndex) => {
                                            // ✅ FIX: The key for the cell is now also robust
                                            const cellKey = `${rowKey}-${col.header || colIndex}`;
                                            const cellContent = col.cell(item);

                                            return (
                                                <td key={cellKey} className="px-6 py-4 whitespace-nowrap">
                                                    {cellContent}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
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

export default AssetGenericTable;