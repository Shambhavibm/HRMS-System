
import { jwtDecode } from "jwt-decode";
import { useMemo } from "react";
import AdminClaimsView from "./admin/AdminClaimsView";
import ManagerClaimsView from "./manager/ManagerClaimsView";
import MemberClaimsView from "./member/MemberClaimsView";
import { BriefcaseIcon, ShieldCheckIcon, UserIcon } from '../../icons'; // Assuming you have an icon library

const ReimbursementsPage = () => {
    const role = useMemo(() => {
        const token = localStorage.getItem("token");
        try {
            return token ? jwtDecode(token).role : null;
        } catch (e) {
            console.error("Invalid token:", e);
            return null;
        }
    }, []);

    const roleInfo = {
        admin: { title: "Admin Dashboard", icon: <BriefcaseIcon className="w-8 h-8 text-brand-500" /> },
        manager: { title: "Manager Dashboard", icon: <ShieldCheckIcon className="w-8 h-8 text-brand-500" /> },
        member: { title: "My Reimbursements", icon: <UserIcon className="w-8 h-8 text-brand-500" /> },
    };

    if (!role) {
        return <div className="p-6 text-center text-gray-500">Error: Could not determine user role.</div>;
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    {roleInfo[role].icon}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Reimbursements
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                           {roleInfo[role].title}: Submit, track, and manage expense claims.
                        </p>
                    </div>
                </div>

                {/* Render role-specific content */}
                {role === 'admin' && <AdminClaimsView />}
                {role === 'manager' && <ManagerClaimsView />}
                {role === 'member' && <MemberClaimsView />}
            </div>
        </div>
    );
};

export default ReimbursementsPage;