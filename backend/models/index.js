const { sequelize } = require('../config/db');
const OrganizationModel = require('./organization');
const UserModel = require('./user');
const LeadCustomerModel = require('./lead_customer_portal');
const LeaveTypeSettingModel = require('./leave_type_setting');
const LeaveRequestModel = require('./leave_requests');
const TeamModel = require('./team');
const TeamMembersModel = require('./team_members');
const UserEducationModel = require('./UserEducation');
const UserWorkExperienceModel = require('./UserWorkExperience');
const CalendarEventModel = require('./CalendarEvents');
const SalaryStructureModel = require('./SalaryStructure');
const SalaryComponentModel = require('./SalaryComponent');
const ReimbursementModel = require('./Reimbursement');
const ProjectModel = require('./Project');
const ProjectAssignmentModel = require('./ProjectAssignment');
const ProjectMilestoneModel = require('./ProjectMilestone');
const ProjectUpdateModel = require('./ProjectUpdate');
const ProjectCostModel = require('./ProjectCost');
const NotificationModel = require('./notification');
const OfficeLocationModel = require('./OfficeLocation');
const AssetStockModel = require('./AssetStock');
const AssetCategoryModel = require('./AssetCategory');
const AssetITModel = require('./Asset');
const AssetRequestModel = require('./AssetRequest');
const AssetAssignmentModel = require('./AssetAssignment');
const LeaveCarryforwardModel = require('./leave_carryforward');
const LeaveEncashmentModel = require('./leave_encashment');
const NotificationPreferenceModel = require('./notificationPreference');
const HolidayModel = require('./holiday');
const OptionalLeaveBookingModel = require('./optional_leave_booking');
const IssueTypeModel = require('./issueType');
const StatusMasterModel = require('./statusMaster');
const AssignTaskModel = require('./assignTask');
/** NEW: Import IssueActivityLog model */
const IssueActivityLogModel = require('./IssueActivityLog');
// --- END ADDED NEW IMPORTS ---

// Initialize models
const Organization = OrganizationModel(sequelize);
const User = UserModel(sequelize);
const lead_customer_portal = LeadCustomerModel(sequelize);
const leave_type_setting = LeaveTypeSettingModel(sequelize);
const leave_requests = LeaveRequestModel(sequelize);
const teams = TeamModel(sequelize);
const team_members = TeamMembersModel(sequelize);
const UserEducation = UserEducationModel(sequelize);
const UserWorkExperience = UserWorkExperienceModel(sequelize);
const CalendarEvent = CalendarEventModel(sequelize);
const SalaryStructure = SalaryStructureModel(sequelize);
const SalaryComponent = SalaryComponentModel(sequelize);
const Reimbursement = ReimbursementModel(sequelize);
const Project = ProjectModel(sequelize);
const ProjectAssignment = ProjectAssignmentModel(sequelize);
const ProjectMilestone = ProjectMilestoneModel(sequelize);
const ProjectUpdate = ProjectUpdateModel(sequelize);
const ProjectCost = ProjectCostModel(sequelize);
const Notification = NotificationModel(sequelize);
const OfficeLocation = OfficeLocationModel(sequelize);
const AssetStock = AssetStockModel(sequelize);
const AssetCategory = AssetCategoryModel(sequelize);
const Asset = AssetITModel(sequelize);
const AssetRequest = AssetRequestModel(sequelize);
const AssetAssignment = AssetAssignmentModel(sequelize);
const LeaveCarryforward = LeaveCarryforwardModel(sequelize);
const LeaveEncashment = LeaveEncashmentModel(sequelize);
const NotificationPreference = NotificationPreferenceModel(sequelize);
const Holiday = HolidayModel(sequelize);
const optional_leave_booking = OptionalLeaveBookingModel(sequelize);
const IssueType = IssueTypeModel(sequelize);
const StatusMaster = StatusMasterModel(sequelize);
const AssignTask = AssignTaskModel(sequelize);
/** NEW: Initialize IssueActivityLog model */
const IssueActivityLog = IssueActivityLogModel(sequelize);



// === Associations (no duplicates) ===
Organization.hasMany(User, { foreignKey: 'organization_id', as: 'users' });
User.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

User.hasOne(SalaryStructure, { foreignKey: 'user_id', as: 'SalaryStructure' });
SalaryStructure.belongsTo(User, { foreignKey: 'user_id' });

Organization.hasMany(SalaryComponent, { foreignKey: 'organization_id', as: 'salaryComponents' });
SalaryComponent.belongsTo(Organization, { foreignKey: 'organization_id' });

leave_requests.belongsTo(User, { foreignKey: 'employee_id', as: 'employee' });
User.hasMany(leave_requests, { foreignKey: 'employee_id', as: 'leaves' });

User.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });
User.hasMany(User, { as: 'subordinates', foreignKey: 'manager_id' });

User.hasMany(UserEducation, { foreignKey: 'user_id', as: 'education' });
UserEducation.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(UserWorkExperience, { foreignKey: 'user_id', as: 'work_experience' });
UserWorkExperience.belongsTo(User, { foreignKey: 'user_id' });

teams.hasMany(team_members, { foreignKey: 'team_id', as: 'members' });
team_members.belongsTo(teams, { foreignKey: 'team_id', as: 'team' });
team_members.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(team_members, { foreignKey: 'user_id', as: 'teamLinks' });
teams.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
User.hasMany(teams, { foreignKey: 'manager_id', as: 'managed_teams' });

// Project Management
Organization.hasMany(Project, { foreignKey: 'organization_id', as: 'projects', onDelete: 'CASCADE' });
Project.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
// --- CRITICAL FIX: Project.belongsTo(User) for projectManager ---
Project.belongsTo(User, {
  as: 'projectManager', // This alias MUST match what's used in AssignTaskController
  foreignKey: 'project_manager_id', // The column in the 'projects' table
  targetKey: 'user_id', // The column in the 'users_onboarded' table
});
// --- END CRITICAL FIX ---
Project.hasMany(ProjectAssignment, { foreignKey: 'project_id', as: 'assignments' });
ProjectAssignment.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
User.hasMany(ProjectAssignment, { foreignKey: 'assigned_manager_id', as: 'managed_assignments' });
ProjectAssignment.belongsTo(User, { foreignKey: 'assigned_manager_id', as: 'assigned_manager' });
team_members.hasMany(ProjectAssignment, { foreignKey: 'team_id', as: 'projectAssignments' });
ProjectAssignment.belongsTo(teams, { foreignKey: 'team_id', as: 'team' });
Organization.hasMany(ProjectAssignment, { foreignKey: 'organization_id', as: 'projectAssignments' });
ProjectAssignment.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

Project.hasMany(ProjectMilestone, { foreignKey: 'project_id', as: 'projectMilestones'  });
ProjectMilestone.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(ProjectUpdate, { foreignKey: 'project_id', as: 'projectUpdates'});
ProjectUpdate.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
User.hasMany(ProjectUpdate, { foreignKey: 'user_id', as: 'submittedUpdates' });
ProjectUpdate.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ProjectUpdate, { foreignKey: 'approved_by', as: 'approved_updates',as: 'approvedUpdatesByManager' });
ProjectUpdate.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

Project.hasMany(ProjectCost, { foreignKey: 'project_id',as: 'projectCosts' });
ProjectCost.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
User.hasMany(ProjectCost, { foreignKey: 'added_by', as: 'addedCostsByUser' });
ProjectCost.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });

// Calendar Events
teams.hasMany(CalendarEvent, { foreignKey: 'team_id', as: 'team_events' });
CalendarEvent.belongsTo(teams, { foreignKey: 'team_id', as: 'team' });
User.hasMany(CalendarEvent, { foreignKey: 'created_by_user_id', as: 'created_events' });
CalendarEvent.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'created_by_user' });
User.hasMany(CalendarEvent, { foreignKey: 'target_user_id', as: 'targeted_events' });
CalendarEvent.belongsTo(User, { foreignKey: 'target_user_id', as: 'target_user' });
Organization.hasMany(CalendarEvent, { foreignKey: 'organization_id', as: 'organization_events' });
CalendarEvent.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });

// Reimbursements
User.hasMany(Reimbursement, { foreignKey: 'user_id', as: 'reimbursements' });
Reimbursement.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });
User.hasMany(Reimbursement, { foreignKey: 'approved_by', as: 'approved_reimbursements' });
Reimbursement.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Asset System
Organization.hasMany(AssetCategory, { foreignKey: 'organization_id' });
AssetCategory.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(Asset, { foreignKey: 'organization_id' });
Asset.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(AssetRequest, { foreignKey: 'organization_id' });
AssetRequest.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(AssetAssignment, { foreignKey: 'organization_id' });
AssetAssignment.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(Notification, { foreignKey: 'organization_id', as: 'notifications' });
Notification.belongsTo(Organization, { foreignKey: 'organization_id', as: 'organization' });
Organization.hasMany(OfficeLocation, { foreignKey: 'organization_id' });
OfficeLocation.belongsTo(Organization, { foreignKey: 'organization_id' });
Organization.hasMany(AssetStock, { foreignKey: 'organization_id' });
AssetStock.belongsTo(Organization, { foreignKey: 'organization_id' });

User.hasMany(AssetRequest, { foreignKey: 'user_id', as: 'requested_assets' });
AssetRequest.belongsTo(User, { foreignKey: 'user_id', as: 'requester' });
User.hasMany(AssetAssignment, { foreignKey: 'user_id', as: 'assignments' });
AssetAssignment.belongsTo(User, { foreignKey: 'user_id', as: 'assignee' });
User.hasMany(Notification, { foreignKey: 'sender_user_id', as: 'sentNotifications' });
User.hasMany(Notification, { foreignKey: 'recipient_user_id', as: 'receivedNotifications' });

Notification.belongsTo(User, { foreignKey: 'sender_user_id', as: 'Sender' });
Notification.belongsTo(User, { foreignKey: 'recipient_user_id', as: 'Recipient' });


AssetCategory.hasMany(Asset, { foreignKey: 'category_id' });
Asset.belongsTo(AssetCategory, { foreignKey: 'category_id', as: 'category' });
AssetCategory.hasMany(AssetRequest, { foreignKey: 'category_id' });
AssetRequest.belongsTo(AssetCategory, { foreignKey: 'category_id', as: 'category' });
AssetCategory.hasMany(AssetStock, { foreignKey: 'category_id' });
AssetStock.belongsTo(AssetCategory, { foreignKey: 'category_id', as: 'category' });

OfficeLocation.hasMany(Asset, { foreignKey: 'location_id', as: 'serializedAssets' });
Asset.belongsTo(OfficeLocation, { foreignKey: 'location_id', as: 'location' });
OfficeLocation.hasMany(AssetStock, { foreignKey: 'location_id', as: 'stockItems' });
AssetStock.belongsTo(OfficeLocation, { foreignKey: 'location_id', as: 'location' });
AssetRequest.belongsTo(OfficeLocation, { foreignKey: 'location_id', as: 'location' });

AssetRequest.belongsTo(User, { foreignKey: 'primary_approver_id', as: 'primaryApprover' });
AssetRequest.belongsTo(User, { foreignKey: 'secondary_approver_id', as: 'secondaryApprover' });
AssetRequest.belongsTo(User, { foreignKey: 'final_approver_id', as: 'finalApprover' });
AssetRequest.belongsTo(User, { foreignKey: 'assigned_to_resource_id', as: 'resourceAssignee' });
AssetRequest.hasOne(AssetAssignment, { foreignKey: 'request_id', as: 'fulfillmentAssignment' });
AssetAssignment.belongsTo(AssetRequest, { foreignKey: 'request_id', as: 'assetRequest' });
AssetAssignment.belongsTo(User, { foreignKey: 'received_by_id', as: 'receivedBy' });
AssetAssignment.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
Asset.hasMany(AssetAssignment, { foreignKey: 'asset_id', as: 'assignments' });
AssetAssignment.belongsTo(AssetStock, { foreignKey: 'stock_id', as: 'stock' });
AssetStock.hasMany(AssetAssignment, { foreignKey: 'stock_id', as: 'stock_assignments' });

User.hasMany(LeaveCarryforward, { foreignKey: 'employee_id', as: 'carryforwards' });
LeaveCarryforward.belongsTo(User, { foreignKey: 'employee_id', as: 'employee' });
User.hasMany(LeaveEncashment, { foreignKey: 'employee_id', as: 'leaveEncashments' });
LeaveEncashment.belongsTo(User, { foreignKey: 'employee_id', as: 'employee' });

User.hasMany(optional_leave_booking, { foreignKey: 'user_id', as: 'optional_bookings' });
optional_leave_booking.belongsTo(User, { foreignKey: 'user_id', as: 'employee' });

Holiday.hasMany(optional_leave_booking, { foreignKey: 'holiday_id', as: 'bookings' });
optional_leave_booking.belongsTo(Holiday, { foreignKey: 'holiday_id', as: 'holiday' });


// AssignTask ↔ Organization
Organization.hasMany(AssignTask, {
  foreignKey: 'organization_id',
  as: 'assignedTasks',
  onDelete: 'CASCADE'
});
AssignTask.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

Project.hasMany(AssignTask, {
  foreignKey: 'project_id',
  as: 'tasks',
  onDelete: 'CASCADE'
});
AssignTask.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project'
});

IssueType.hasMany(AssignTask, {
  foreignKey: 'issue_type_id',
  as: 'tasks'
});
AssignTask.belongsTo(IssueType, {
  foreignKey: 'issue_type_id',
  as: 'issueType'
});

StatusMaster.hasMany(AssignTask, {
  foreignKey: 'current_status_id',
  as: 'tasks'
});
AssignTask.belongsTo(StatusMaster, {
  foreignKey: 'current_status_id',
  as: 'currentStatus'
});

User.hasMany(AssignTask, {
  foreignKey: 'reporter_id',
  as: 'reportedTasks'
});
AssignTask.belongsTo(User, {
  foreignKey: 'reporter_id',
  as: 'reporter'
});

User.hasMany(AssignTask, {
  foreignKey: 'assignee_id',
  as: 'assignedTasks'
});
AssignTask.belongsTo(User, {
  foreignKey: 'assignee_id',
  as: 'assignee'
});

AssignTask.belongsTo(teams, {
  foreignKey: 'team_id', 
  targetKey: 'id',
  as: 'team'
});

teams.hasMany(AssignTask, {
  foreignKey: 'team_id',
  as: 'assignedTasksInTeam'
});

// // AssignTask Self-Referencing (Parent/Sub-issues)
// AssignTask.hasMany(AssignTask, {
//   as: 'subTasks',
//   foreignKey: 'parent_issue_id'
// });
AssignTask.belongsTo(AssignTask, {
  as: 'parentIssue',
  foreignKey: 'parent_issue_id'
});

/** NEW: Associations for IssueActivityLog */
// IssueActivityLog belongs to AssignTask
IssueActivityLog.belongsTo(AssignTask, {
  foreignKey: 'issue_id',
  as: 'issue',
  onDelete: 'CASCADE' // Ensure logs are deleted if the issue is
});

// IssueActivityLog belongs to User (who performed the activity)
IssueActivityLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// AssignTask has many IssueActivityLogs (already added in AssignTask.js, but good to confirm here)
AssignTask.hasMany(IssueActivityLog, {
  foreignKey: 'issue_id',
  as: 'activityLogs'
});

// ✅ Self-Referencing Association for Primary Manager
User.belongsTo(User, { as: 'PrimaryManager', foreignKey: 'manager_id_primary' });
User.hasMany(User, { as: 'PrimarySubordinates', foreignKey: 'manager_id_primary' });

// ✅ Self-Referencing Association for Secondary Manager
User.belongsTo(User, { as: 'SecondaryManager', foreignKey: 'manager_id_secondary' });
User.hasMany(User, { as: 'SecondarySubordinates', foreignKey: 'manager_id_secondary' });

/** END NEW: Associations for IssueActivityLog */

// --- END ADDED NEW ASSOCIATIONS ---

sequelize.sync({})
  .then(() => console.log("✅ All tables synced"))
  .catch((err) => console.error("❌ Sync error:", err));

module.exports = {
  sequelize,
  Organization,
  User,
  lead_customer_portal,
  leave_type_setting,
  leave_requests,
  teams,
  team_members,
  UserEducation,
  UserWorkExperience,
  CalendarEvent,
  SalaryStructure,
  SalaryComponent,
  Reimbursement,
  Project,
  ProjectAssignment,
  ProjectMilestone,
  ProjectUpdate,
  ProjectCost,
  Notification,
  OfficeLocation,
  AssetStock,
  AssetCategory,
  Asset,
  AssetRequest,
  AssetAssignment,
  LeaveCarryforward,
  LeaveEncashment,
  NotificationPreference,
  Holiday,
  optional_leave_booking,
  IssueType,
  StatusMaster,
  AssignTask,
  /** NEW: Export IssueActivityLog model */
  IssueActivityLog,
  // --- END ADDED NEW EXPORTS ---
};