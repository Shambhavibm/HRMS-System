import React from 'react';

const InfoField = ({ label, value, children }) => (
    <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <div className="text-sm font-medium text-gray-800 dark:text-white">
            {children || value || 'N/A'}
        </div>
    </div>
);

export default InfoField;