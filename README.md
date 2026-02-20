

# 🚀 HRMS Portal — Full Stack Human Resource Management System

A secure and scalable full-stack authentication portal built with **React**, **Express**, **Sequelize**, and **MySQL**, styled using **TailAdmin** UI kit. This system features user login, registration, email-based password reset, session management, and more.

---

## 🚀 Features

- ✅ JWT-based authentication
- ✅ Secure login/logout with token blacklist support
- ✅ Email-based password reset with time-limited tokens
- ✅ Role-ready user architecture (admin, staff, client)
- ✅ Responsive, modern UI using TailAdmin (MIT licensed)
- ✅ Environment-configured API base URLs (`.env`)
- ✅ Token expiration, session kill, and inactivity logout
- ✅ Fully modular and extendable structure (MVC + Hooks)

---

## 📁 Folder Structure

```
project-root/
│
├── backend/               # Express.js + Sequelize + MySQL API
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── config/
│   ├── app.js
│   └── .env
│
├── frontend/              # Vite + React + TailAdmin UI
│   ├── src/
│   ├── public/
│   └── .env
│
├── LICENSE.md
└── README.md
```

---

## ⚙️ Environment Configuration

### 🔐 Backend (`backend/.env`)
```env
PORT=5001
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASS=yourpassword
DB_NAME=hrms_auth
JWT_SECRET=your_super_secret_key
EMAIL_USER=your@email.com
EMAIL_PASS=email_password
```

### 🌐 Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_ENV_LOADED=YES
```

---

## 🧑‍💻 Development Setup

### 1. Clone Repo

```bash
git clone https://github.com/Shambhavibm/HRMS-System
cd HRMS-System
```

---

### 2. Start Backend

```bash
cd backend
npm install
npx sequelize db:create   # if using CLI
npx sequelize db:migrate  # optional: for running migrations
npm start
```

> ✅ Running at: `http://localhost:5001`

---

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

> ✅ Running at: `http://localhost:3000`

---

## 🧪 API Endpoints

| Method | Endpoint                 | Description                |
|--------|--------------------------|----------------------------|
| POST   | `/auth/register`         | Admin/organization setup   |
| POST   | `/auth/signin`           | Login                      |
| POST   | `/auth/reset-password`   | Accept new password        |
| POST   | `/auth/logout`           | Logout + blacklist token   |
| POST   | `/auth/lead-customer`    | Capture customer leads     |

---

## 🛡️ Security Features

- 🔒 Token expiration + validation
- 🧼 Local storage cleanup on logout
- 🔐 Backend token blacklist (recommend Redis for prod)
- 💤 Inactivity auto-logout (after 15 mins)
- 🧪 Auth-guarded frontend routes
- 🔁 Reset token expiry (configurable, e.g. 15 mins)

---

## 🌍 Deployment (Basic VPS/Node Server)

```bash
# Backend
cd backend
pm2 start app.js --name hrms-api

# Frontend (build)
cd frontend
npm run build
serve -s dist -l 3000
```

> Optionally use nginx reverse proxy + HTTPS with certbot.

---

## 📦 Future Enhancements

- 🔐 2FA / OTP-based login
- 📧 Admin verification before user activation
- 🌐 Multi-org login (SaaS model)
- 🧾 Audit logging
- 📊 Admin dashboard (users, login stats, API usage)
- 📦 Dockerization

---


## 👩‍💻 Author

**Shambhavi B M**  
MCA Graduate | Full Stack Developer  

---

## ✉️ Contact

📧 Email: your-email@gmail.com  
🔗 LinkedIn: https://linkedin.com/in/shambhavi-b-m

---

_Contributions welcome. Security matters more than features. Focus on clean, reusable, and testable code._

# HRMS-System
A comprehensive Full Stack Human Resource Management System (HRMS) featuring company and employee onboarding, task tracking, leave management, payroll processing, calendar scheduling, and secure authentication. Built using modern web technologies with MySQL database integration.

