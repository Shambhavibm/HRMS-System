

// Core modules and dependencies
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { Server } = require('socket.io'); // 🔥 FIXED: Import was missing here
require('dotenv').config();
const path = require('path');

// Import database connection and routes
const { sequelize } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); 
const teamRoutes = require('./routes/teamRoutes');

const calendarEventRoutes = require('./routes/calendarEventRoutes');

//user education and workexperience import part  
const userEducationRoutes = require("./routes/userEducationRoutes");
const userWorkExperienceRoutes = require("./routes/userWorkExperienceRoutes");
//admin dashboard project import
const projectRoutes = require("./routes/projectRoutes");
const projectAssignmentRoutes = require('./routes/projectAssignmentRoutes');
//project progress routes related to update,aprove
const projectProgressRoutes = require('./routes/projectProgressRoutes');
const projectCostRoutes = require('./routes/projectCostRoutes');
const leaveRequestRoutes = require('./routes/leaveRequestsRoutes');
const reimbursementRoutes = require('./routes/reimbursementRoutes');
const payrollRoutes = require('./routes/payrollRoutes'); 
const assetRoutes = require('./routes/assetRoutes')
const leaveCarryforwardRoutes = require('./routes/leaveCarryforwardRoutes');
const holidayRoutes = require('./routes/holidayRoutes');

// --- ADDED: NEW IMPORTS FOR TASK MANAGEMENT MODULE ---
const assignTaskRoutes = require('./routes/assignTaskRoutes');
const taskConfigRoutes = require('./routes/taskConfigRoutes'); // Renamed from configRoutes as discussed
// --- END ADDED NEW IMPORTS ---
/** NEW: Import the new issue activity log routes */
const issueActivityLogRoutes = require('./routes/issueActivityLogRoutes');
/** END NEW: Import */

const app = express();
const server = http.createServer(app);
const notificationRoutes = require('./routes/notifications');


// --- SOCKET.IO SETUP ---
const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL || "http://localhost:3000", // 🔐 Restrict this in production
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Expose io instance
app.set("io", io);

// --- MIDDLEWARE ---

// Secure HTTP headers
// app.use(helmet());
app.use(helmet({                                            //to allow images added this
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Parse cookies and JSON
app.use(cookieParser());
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.BASE_URL || "http://localhost:3000",
  credentials: true,
}));

// Logging for every request
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Basic test route
app.get('/', (req, res) => {
  res.send('HRMS Backend is running!');
});


// Rate limiter to protect from brute-force or abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // ✅ RECOMMENDED
app.use("/api/user-education", userEducationRoutes);
app.use("/api/user-work-experience", userWorkExperienceRoutes);
app.use("/uploads", express.static(path.join(__dirname, 'uploads'))); // Serve images
app.use("/api/office-locations", require("./routes/officeLocationRoutes"));



app.use('/api/calendar-events', calendarEventRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/organization/leave-settings', require('./routes/leaveSettingsRoutes'));
app.use('/api/organization/leaves', require('./routes/leaveRequestsRoutes'));
//calendar
//app.use("/api/calendar-events", calendarEventRoutes);
app.use('/api/calendar-events', calendarEventRoutes);

// app.use('/api/admin/teams', require('./routes/teamRoutes'));
app.use('/api/admin/teams', require('./routes/teamRoutes'));
// --- ADDED: Team routes for manager dashboard (if different from admin) ---
app.use('/api/manager/teams', teamRoutes); // Assuming teamRoutes handles both admin and manager contexts
// --- END ADDED ---
app.use('/api/admin/users', require('./routes/userRoutes'));
app.use('/api', require('./routes/managerLeaveRoutes'));
app.use('/api', require('./routes/adminLeaveRoutes'));
app.use('/api', leaveRequestRoutes); // ✅ Add this after all route imports
app.use('/api/admin', require('./routes/adminLeaveRoutes'));
app.use('/api/admin/leave-carryforward', leaveCarryforwardRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// project related paths
app.use('/api', projectProgressRoutes); 
app.use("/api/projects", projectRoutes);
app.use('/api', projectAssignmentRoutes);
app.use('/api', projectCostRoutes); 
app.use('/api/payroll', payrollRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/assets', assetRoutes);

// --- ADDED: NEW ROUTE DEFINITIONS FOR TASK ASSIGNMENT MODULE ---
// These will be accessed at /api/assign-tasks, /api/issue-types, /api/statuses
app.use('/api', assignTaskRoutes); // Changed prefix to '/api' to allow '/api/assign-tasks'
app.use('/api', taskConfigRoutes); // Changed prefix to '/api' to allow '/api/issue-types' and '/api/statuses'
// --- END ADDED NEW ROUTES ---


/** NEW: Mount the new issue activity log routes */
// These routes are defined as /issues/:id/comments, /issues/:id/log-time, /issues/:id/activity
// Mounting them under '/api' makes them accessible at /api/issues/:id/...
app.use('/api', issueActivityLogRoutes);
/** END NEW: Mount */

// --- SOCKET.IO EVENTS ---
io.on("connection", (socket) => {
  console.log("✅ Socket.IO client connected");

  socket.on("disconnect", () => {
    console.log("❌ Socket.IO client disconnected");
  });
});

// --- DATABASE SYNC & SERVER START ---
sequelize.sync({ alter: false })
  .then(() => {
    console.log('✅ Database connected');

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`🚀 Backend running with Socket.IO on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

// --- OPTIONAL: Joi validation example schema ---
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});
