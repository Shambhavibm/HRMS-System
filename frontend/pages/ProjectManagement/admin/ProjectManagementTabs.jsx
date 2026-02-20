import React, { useState } from 'react';
import AddProject from './AddProject';
import AssignProject from './ProjectAssignment';
import ViewProject from './ViewProjects';
import { BoxCubeIcon } from '../../../icons'; 

const ProjectManagementTabs = () => {
    const [activeTab, setActiveTab] = useState('add');

    const TabButton = ({ id, title }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${activeTab === id
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
            {title}
        </button>
    );

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Page Heading */}
                <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <BoxCubeIcon className="w-8 h-8 text-brand-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Project Management
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Admin Dashboard: Manage project creation, assignment, and tracking.
                        </p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                    <div className="flex space-x-3 mb-4 bg-gray-100 dark:bg-gray-900 p-2 rounded-lg">
                        <TabButton id="add" title="Add Project" />
                        <TabButton id="assign" title="Assign Project" />
                        <TabButton id="view" title="View Projects" />
                    </div>

                    {/* Subheading (optional - based on tab) */}
                    <div className="mb-4">
                        {activeTab === 'add' && (
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Create a New Project</h2>
                        )}
                        {activeTab === 'assign' && (
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Assign Project to Team</h2>
                        )}
                        {activeTab === 'view' && (
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Project Overview Table</h2>
                        )}
                    </div>

                    {/* Tab Content */}
                    <div>
                        {activeTab === 'add' && <AddProject />}
                        {activeTab === 'assign' && <AssignProject />}
                        {activeTab === 'view' && <ViewProject />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectManagementTabs;
