import React, { useState } from 'react';
import SubmitClaimForm from '../common/SubmitClaimForm';
import MyClaimsDashboard from '../common/MyClaimsDashboard';

const MemberClaimsView = () => {
    const [activeTab, setActiveTab] = useState('submit');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleClaimSubmitted = () => {
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('history');
    };

    const TabButton = ({ id, title }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200
                ${activeTab === id
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`
            }
        >
            {title}
        </button>
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex space-x-2 mb-6 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-lg">
                <TabButton id="submit" title="Submit New Claim" />
                <TabButton id="history" title="My Claim History" />
            </div>

            <div>
                {activeTab === 'submit' && <SubmitClaimForm onClaimSubmitted={handleClaimSubmitted} />}
                {activeTab === 'history' && <MyClaimsDashboard />}
                {/* {activeTab === 'history' && <MyClaimsList refreshTrigger={refreshTrigger} />} */}
            </div>
        </div>
    );
};

export default MemberClaimsView;