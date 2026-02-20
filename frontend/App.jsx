
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'react-datepicker/dist/react-datepicker.css';
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// --- Import the new, centralized Route Protection Components ---
import { ProtectedRoute, RoleRoute } from "./utils/RouteProtection";

// --- Import Layouts and Common Components ---
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// --- Import all your pages as you did before ---
import SignIn from "./pages/PortalAccess/SignIn";
import SignUp from "./pages/PortalAccess/SignUp";
import Hello from "./pages/PortalAccess/Hello";
import InviteEmployee from "./pages/PortalAccess/InviteEmployee";
import ResetPassword from "./pages/PortalAccess/ResetPassword";
import SuperadminOnboarding from "./pages/PortalAccess/SuperadminOnboarding";
import NotFound from "./pages/OtherSupportingPages/NotFound";
import UserProfiles from "./pages/UserProfileManagement/UserProfiles";
import CreateTeam from './pages/TeamsManagement/admin/CreateTeam';
import AssignMembers from './pages/TeamsManagement/admin/AssignMembers';
import EditTeam from "./pages/TeamsManagement/admin/EditTeam";
import EditTeamList from './pages/TeamsManagement/admin/EditTeamList';
import AssignManagers from "./pages/TeamsManagement/admin/AssignManagers";
import ManagerTeamView from "./pages/TeamsManagement/manager/ManagerTeamView";
import Home from "./pages/DashboardPortfolioManagement/admin/AdminDashboardPortfolioManagement";
import ManagerDashboard from "./pages/DashboardPortfolioManagement/manager/ManagerDashboardPortfolioManagement";
import MemberDashboard from './pages/DashboardPortfolioManagement/member/MemberDashboardPortfolioManagement';
import AddProject from './pages/ProjectManagement/admin/AddProject';
import AssignProject from './pages/ProjectManagement/admin/ProjectAssignment';
import ViewProject from "./pages/ProjectManagement/admin/ViewProjects";
import EditProject from "./pages/ProjectManagement/admin/EditProject";
import AdminProjectProgressDashboard from './pages/ProjectProgressReport/admin/AdminProjectProgressReport';
import ManagerProjectProgressDashboard from './pages/ProjectProgressReport/manager/ManagerProjectProgressReport';
import MemberProjectProgressDashboard from './pages/ProjectProgressReport/member/MemberProjectProgressReport';
import LeaveSettings from "./pages/LeaveManagement/admin/LeaveSettings";
import ApplyLeave from './pages/LeaveManagement/common/ApplyLeave';
import Leaves from "./pages/LeaveManagement/member/Leaves";
import ManagerLeaveRequests from './pages/LeaveManagement/manager/LeaveRequests';
import AdminLeaveRequests from './pages/LeaveManagement/admin/AdminLeaveRequests';
import AdminPayrollHome from './pages/PayrollManagementModule/admin/PayrollHome';
import ManagerPayrollHome from './pages/PayrollManagementModule/manager/PayrollHome';
import MemberPayrollHome from './pages/PayrollManagementModule/member/PayrollHome';
import SalaryDetails from './pages/PayrollManagementModule/admin/SalaryDetails';
import SalaryComponents from './pages/PayrollManagementModule/admin/SalaryComponents';
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/CalenderManagementModule/admin/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import ReimbursementsPage from "./pages/ReimbursementsModule/ReimbursementsPage";
import AssetITInventoryPage from "./pages/AssetITInventoryModule/AssetITInventoryPage";
import ManagerViewProjects from "./pages/TaskManagement/manager/ViewProjects";
import ManagerViewTeams from "./pages/TeamsManagement/manager/ManagerTeamView";
import TeamDetailsTable  from "./pages/TeamsManagement/manager/TeamDetailsTable";
import AssignTaskPage from './pages/TaskManagement/manager/AssignTask';
import MemberTask from './pages/TaskManagement/member/MemberTask'; 
import AdminAssignTaskPage from './pages/TaskManagement/admin/AssignTask';
import ManagerLeaveAnalytics from './pages/LeaveManagement/manager/ManagerLeaveAnalytics';
import TeamManagement from './pages/TeamsManagement/admin/TeamManagement';
import EmployeeDetailsPage from "./pages/DashboardPortfolioManagement/admin/EmployeeDetailsPage";

import NotificationCenter from './pages/NotificationAccess/NotificationCenter';
import NotificationPreferences from './pages/NotificationAccess/NotificationPreferences';

import OptionalLeaveBooking from "./pages/LeaveManagement/common/OptionalLeaveBooking";
import ProjectManagementTabs from './pages/ProjectManagement/admin/ProjectManagementTabs';



export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      {/* NO MORE INLINE ROUTE PROTECTION COMPONENTS HERE */}

      <Routes>
        {/* ===================================================================== */}
        {/* == PUBLIC ROUTES (No login required)                             == */}
        {/* ===================================================================== */}
        <Route path="/" element={<SignIn />} />
        <Route path="/hello" element={<Hello />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/superadmin-onboarding" element={<SuperadminOnboarding />} />

        {/* ===================================================================== */}
        {/* == PROTECTED ROUTES (All routes inside require login and a role) == */}
        {/* ===================================================================== */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>

          {/* --- DASHBOARDS --- */}
          {/* Note: An admin can't see the manager/member dashboard directly via URL. Each role gets their own. */}
          <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={['admin']}><Home /></RoleRoute>} />
          <Route path="/manager/dashboard" element={<RoleRoute allowedRoles={['manager']}><ManagerDashboard /></RoleRoute>} />
          <Route path="/member/dashboard" element={<RoleRoute allowedRoles={['member']}><MemberDashboard /></RoleRoute>} />

          {/* --- COMMON PAGES (Accessible by any authenticated role) --- */}
          <Route path="/profile" element={<ProtectedRoute><UserProfiles /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><UserProfiles /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/:role/reimbursements" element={<RoleRoute allowedRoles={['admin', 'manager', 'member']}><ReimbursementsPage /></RoleRoute>} />
          <Route path="/:role/assets-inventory" element={<RoleRoute allowedRoles={['admin', 'manager', 'member']}><AssetITInventoryPage /></RoleRoute>} />
          <Route path="/optional-leave-booking" element={<OptionalLeaveBooking />} />


          {/* --- ADMIN-ONLY ROUTES --- */}
          <Route path="/invite-employee" element={<RoleRoute allowedRoles={['admin']}><InviteEmployee /></RoleRoute>} />
          <Route path="/admin/leavemanagement" element={<RoleRoute allowedRoles={['admin']}><LeaveSettings /></RoleRoute>} />
          <Route path="/admin/create-team" element={<RoleRoute allowedRoles={['admin']}><CreateTeam /></RoleRoute>} />
          <Route path="/admin/assign-members" element={<RoleRoute allowedRoles={['admin']}><AssignMembers /></RoleRoute>} />
          <Route path="/admin/teams/edit" element={<RoleRoute allowedRoles={['admin']}><EditTeamList /></RoleRoute>} />
         <Route path="/admin/teams/edit/:id" element={<RoleRoute allowedRoles={['admin']}><EditTeam /></RoleRoute>} />
          <Route path="/admin/teams/manage" element={<RoleRoute allowedRoles={['admin']}><TeamManagement /></RoleRoute>} />
         <Route path="/admin/teams/manage/:tab" element={<RoleRoute allowedRoles={['admin']}><TeamManagement /></RoleRoute>} />
          <Route path="/admin/assign-managers" element={<RoleRoute allowedRoles={['admin']}><AssignManagers /></RoleRoute>} />
          <Route path="/admin/add-project" element={<RoleRoute allowedRoles={['admin']}><AddProject /></RoleRoute>} />
          <Route path="/admin/assign-project" element={<RoleRoute allowedRoles={['admin']}><AssignProject /></RoleRoute>} />
          <Route path="/admin/view-projects" element={<RoleRoute allowedRoles={['admin']}><ViewProject /></RoleRoute>} />
          <Route path="/admin/edit-project/:projectId" element={<RoleRoute allowedRoles={['admin']}><EditProject /></RoleRoute>} />
          <Route path="/admin/project-progress/*" element={<RoleRoute allowedRoles={['admin']}><AdminProjectProgressDashboard /></RoleRoute>} />
          <Route path="/admin/leave-requests" element={<RoleRoute allowedRoles={['admin']}><AdminLeaveRequests /></RoleRoute>} />
          <Route path="/admin/payroll/home" element={<RoleRoute allowedRoles={['admin']}><AdminPayrollHome /></RoleRoute>} />
          <Route path="/admin/payroll/salary-details" element={<RoleRoute allowedRoles={['admin']}><SalaryDetails /></RoleRoute>} />
          <Route path="/admin/payroll/settings/components" element={<RoleRoute allowedRoles={['admin']}><SalaryComponents /></RoleRoute>} />
          <Route path="/admin/teams/members/:teamId" element={<RoleRoute allowedRoles={['admin']}><AssignMembers /></RoleRoute>} />  {/* <-- Add this line */}
          <Route path="admin/project-management" element={<RoleRoute allowedRoles={['admin']}><ProjectManagementTabs /> </RoleRoute>} />
          <Route path="/admin/myproject/:projectId/assigntask" element={<RoleRoute allowedRoles={['admin']}><AdminAssignTaskPage /></RoleRoute>} />
          {/* --- MANAGER ROUTES (Rule: An admin can do everything a manager can) --- */}
          <Route path="/manager/my-team" element={<RoleRoute allowedRoles={['manager', 'admin']}><ManagerTeamView /></RoleRoute>} />
          <Route path="/manager/leave-requests" element={<RoleRoute allowedRoles={['manager', 'admin']}><ManagerLeaveRequests /></RoleRoute>} />
          <Route path="/manager/project-progress/*" element={<RoleRoute allowedRoles={['manager', 'admin']}><ManagerProjectProgressDashboard /></RoleRoute>} />
          <Route path="/manager/apply-leave" element={<RoleRoute allowedRoles={['manager', 'admin']}><ApplyLeave /></RoleRoute>} />
          <Route path="/manager/payroll/home" element={<RoleRoute allowedRoles={['manager', 'admin']}><ManagerPayrollHome /></RoleRoute>} />
          <Route path="/manager/leave-analytics" element={<ManagerLeaveAnalytics />} />

           <Route path="/manager/view-projects" element={<ManagerViewProjects />} />
           <Route path="/manager/my-team/:teamId" element={<TeamDetailsTable />} />
           <Route path="/manager/teams/edit" element={<ManagerViewTeams />} />
          <Route path="/manager/myproject/:projectId/assigntask" element={<AssignTaskPage />}/>
          
          {/* --- MEMBER ROUTES (Specific to the 'member' role) --- */}
          <Route path="/member/tasks" element={<ProtectedRoute><MemberTask /></ProtectedRoute>} />
          <Route path="/member/project-update" element={<RoleRoute allowedRoles={['member']}><MemberProjectProgressDashboard /></RoleRoute>} />
          <Route path="/member/payroll/home" element={<RoleRoute allowedRoles={['member']}><MemberPayrollHome /></RoleRoute>} />
          <Route path="/employee/leaves" element={<RoleRoute allowedRoles={['member']}><Leaves /></RoleRoute>} />
          <Route path="/employee/apply-leave" element={<RoleRoute allowedRoles={['member']}><ApplyLeave /></RoleRoute>} />

          {/* --- UI/DEMO PAGES (For development, accessible by any logged-in user) --- */}
          <Route path="/blank" element={<ProtectedRoute><Blank /></ProtectedRoute>} />
          <Route path="/form-elements" element={<ProtectedRoute><FormElements /></ProtectedRoute>} />
          <Route path="/basic-tables" element={<ProtectedRoute><BasicTables /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/avatars" element={<ProtectedRoute><Avatars /></ProtectedRoute>} />
          <Route path="/badge" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
          <Route path="/buttons" element={<ProtectedRoute><Buttons /></ProtectedRoute>} />
          <Route path="/images" element={<ProtectedRoute><Images /></ProtectedRoute>} />
          <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
          <Route path="/line-chart" element={<ProtectedRoute><LineChart /></ProtectedRoute>} />
          <Route path="/bar-chart" element={<ProtectedRoute><BarChart /></ProtectedRoute>} />
          <Route path="/app/notifications" element={<NotificationCenter />} />
          <Route path="/app/settings/notifications" element={<NotificationPreferences />} />
          <Route path="/employee-details/:userId" element={<EmployeeDetailsPage />} />
        </Route>

        {/* --- FALLBACK ROUTE --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}