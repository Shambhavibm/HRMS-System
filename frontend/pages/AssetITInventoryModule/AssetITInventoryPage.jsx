// This will be the main component that orchestrates which role-specific view is rendered.
// UI AssetITInventoryModule/AssetITInventoryPage.jsx
import { jwtDecode } from "jwt-decode";
import { useMemo } from "react";
import AdminAssetsView from "./admin/AdminAssetsView";
import ManagerAssetsView from "./manager/ManagerAssetsView";
import MemberAssetsView from "./member/MemberAssetsView";
import { BoxCubeIcon } from '../../icons'; // Assuming you have an icon for assets

const AssetITInventoryPage = () => {
    const role = useMemo(() => {
        const token = localStorage.getItem("token");
        try {
            //
            return token ? jwtDecode(token).role : null;
        } catch (e) {
            console.error("Invalid token:", e); //
            return null;
        }
    }, []);

    const roleInfo = {
        admin: { title: "Admin Dashboard", icon: <BoxCubeIcon className="w-8 h-8 text-brand-500" /> },
        manager: { title: "Manager Dashboard", icon: <BoxCubeIcon className="w-8 h-8 text-brand-500" /> },
        member: { title: "My Assets & Requests", icon: <BoxCubeIcon className="w-8 h-8 text-brand-500" /> },
    };

    if (!role) {
        return <div className="p-6 text-center text-gray-500">Error: Could not determine user role.</div>; //
    }
    // Handle cases where a role might not be defined in roleInfo
    if (!roleInfo[role]) {
        return <div className="p-6 text-center text-gray-500">Access Denied: Your role does not have a defined view for this module.</div>;
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {roleInfo[role].icon}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Asset & IT Inventory
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                           {roleInfo[role].title}: Manage IT assets, requests, and inventory.
                        </p>
                    </div>
                </div>

                {/* Render role-specific content */}
                {role === 'admin' && <AdminAssetsView />}
                {role === 'manager' && <ManagerAssetsView />}
                {role === 'member' && <MemberAssetsView />}
            </div>
        </div>
    );
};

export default AssetITInventoryPage;