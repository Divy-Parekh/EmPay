# EmPay – System Architecture Overview

## 1. Vision

EmPay is an all-in-one Human Resource Management System (HRMS) designed for startups, institutions, and SMEs. It unifies **Employee Management**, **Attendance Tracking**, **Leave/Time-Off Management**, **Payroll Processing**, and **Analytics/Reporting** into a single, clean, role-aware platform.

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + Vite | Fast HMR, modern JSX, component-driven UI |
| **Styling** | Tailwind CSS v3 | Utility-first with CSS variables for theming |
| **State Management** | React Context + useReducer | Lightweight, no Redux overhead for this scope |
| **Routing** | React Router v6 | Nested layouts, route guards |
| **Charts** | Recharts | Lightweight, React-native chart library |
| **PDF Generation** | react-to-print + html2canvas | Payslip & report printing |
| **Backend** | Node.js + Express.js | Minimalist, well-known REST framework |
| **Database** | PostgreSQL 16 (Docker) | ACID-compliant, relational, raw SQL queries |
| **DB Driver** | pg (node-postgres) | Raw query execution, no ORM |
| **Validation** | Zod | Schema validation for request bodies |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs | Stateless auth with hashed passwords |
| **Email** | Nodemailer | Credential delivery to new employees |
| **File Upload** | Multer | Company logo & leave attachments |
| **Containerization** | Docker + Docker Compose | PostgreSQL + optional full-stack deployment |

---

## 3. High-Level Architecture

```mermaid
graph TB
    subgraph Client["Frontend - React SPA"]
        UI["React Components"]
        CTX["Auth Context + Role Guards"]
        API["API Service Layer"]
    end

    subgraph Server["Backend - Express.js"]
        MW["Middleware: Auth, RBAC, Validation"]
        RT["Route Handlers"]
        SVC["Service Layer: Business Logic"]
        DAL["Database Access Layer: Raw SQL"]
    end

    subgraph Data["PostgreSQL via Docker"]
        TBL["Tables and Indexes"]
    end

    subgraph Mail["Email Service"]
        NM["Nodemailer SMTP"]
    end

    UI --> CTX --> API
    API -->|"HTTP REST JSON"| MW
    MW --> RT --> SVC --> DAL --> TBL
    SVC -->|"Send Credentials"| NM
```

---

## 4. Module Decomposition

The system is decomposed into **7 core modules**, each owning its own routes, services, and database tables:

```mermaid
graph LR
    subgraph Modules
        A["Auth Module"]
        B["Employee Module"]
        C["Attendance Module"]
        D["Time-Off Module"]
        E["Payroll Module"]
        F["Reports Module"]
        G["Settings Module"]
    end

    A -->|"creates users"| B
    B -->|"employee data"| C
    B -->|"employee data"| D
    C -->|"attendance records"| E
    D -->|"approved leaves"| E
    B -->|"salary structure"| E
    E -->|"payslip data"| F
    A -->|"role management"| G
```

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| **Auth** | Admin signup, login (all roles), JWT token management, password reset |
| **Employee** | CRUD employee profiles, resume, private info, salary structure, Login ID generation |
| **Attendance** | Check-in/check-out, daily logs, monthly attendance aggregation |
| **Time-Off** | Leave requests, approval/rejection, allocation management, leave balances |
| **Payroll** | Payrun generation, payslip computation (attendance-based), validation, PDF printing |
| **Reports** | Yearly salary statement generation per employee, PDF printing |
| **Settings** | User role assignment, module-level access configuration |

---

## 5. Role-Based Access Control (RBAC) Matrix

| Module | Admin | Employee | HR Officer | Payroll Officer |
|--------|-------|----------|------------|-----------------|
| **Employees** | CRUD | Read Only | CRUD | Read Only |
| **Attendance** | Read All | Read Own | Read All | Read All |
| **Time Off** | Full Access | Own Only | Full Access | Approve/Reject |
| **Payroll** | Full Access | No Access | No Access | Full Access |
| **Reports** | Full Access | No Access | No Access | Full Access |
| **Settings** | Full Access | No Access | No Access | No Access |
| **Company Details** | Full Access | No Access | No Access | No Access |
| **Salary Info Tab** | Read/Edit | No Access | No Access | Read/Edit |
| **Check In/Out** | Yes | Yes | Yes | Yes |

---

## 6. Data Flow: Key Business Processes

### 6.1 Employee Onboarding Flow

```mermaid
sequenceDiagram
    participant A as Admin or HR
    participant S as Server
    participant DB as PostgreSQL
    participant M as Nodemailer

    A->>S: POST /api/employees with name and email
    S->>S: Generate Login ID using Company Prefix + Name Initials + Year + Serial
    S->>S: Generate random password
    S->>S: Hash password with bcrypt
    S->>DB: INSERT into employees and users tables
    S->>M: Send email with Login ID and password
    S-->>A: 201 Created with employee data
```

### 6.2 Attendance to Payroll Flow

```mermaid
sequenceDiagram
    participant EMP as Employee
    participant S as Server
    participant DB as Database

    Note over EMP,DB: Daily Attendance
    EMP->>S: POST /api/attendance/check-in
    S->>DB: INSERT attendance record with check_in timestamp
    EMP->>S: PUT /api/attendance/check-out
    S->>DB: UPDATE attendance record with check_out and work_hours

    Note over EMP,DB: Payrun at End of Month
    S->>DB: SELECT attendance records for pay period
    S->>DB: SELECT approved time-offs for pay period
    S->>S: Calculate payable days as attendance_days plus paid_leaves
    S->>S: Calculate salary components pro-rata
    S->>S: Apply deductions for PF and Professional Tax
    S->>DB: INSERT payslip record
```

### 6.3 Time-Off Approval Flow

```mermaid
sequenceDiagram
    participant E as Employee
    participant S as Server
    participant AH as Admin or HR Officer

    E->>S: POST /api/time-off with type, dates, attachment
    S->>S: Validate leave balance
    S-->>E: 201 Created with status PENDING
    AH->>S: GET /api/time-off with status filter pending
    AH->>S: PUT /api/time-off/:id/approve
    S->>S: Deduct from leave balance
    S-->>AH: 200 OK with status APPROVED
```

---

## 7. Security Architecture

### Authentication
- **JWT-based** stateless authentication
- Access tokens with **24-hour** expiry
- Tokens stored in `httpOnly` cookies (preferred) or localStorage with XSS mitigation
- Password hashing via **bcryptjs** (salt rounds: 12)

### Authorization
- **Middleware-level** RBAC enforcement on every protected route
- Role checked from JWT payload against route permission config
- Module-level granular access stored in `user_permissions` table

### Data Protection
- Input validation via **Zod** schemas on all POST/PUT endpoints
- SQL injection prevention via **parameterized queries** (pg library `$1, $2` syntax)
- CORS configured for frontend origin only
- Rate limiting on auth endpoints

---

## 8. Salary Computation Engine

The salary engine is the core business logic module:

```
INPUT: Monthly Wage (Fixed)

COMPONENTS (auto-calculated):
  Basic Salary       = 50% of Wage
  HRA                = 50% of Basic
  Standard Allowance = Rs.4,167 (fixed)
  Performance Bonus  = 8.33% of Basic
  Leave Travel       = 8.333% of Basic
  Fixed Allowance    = Wage - Sum(all above)

GROSS = Sum of all components = Wage

DEDUCTIONS:
  PF (Employee)      = 12% of Basic
  PF (Employer)      = 12% of Basic
  Professional Tax   = Rs.200/month

NET PAY = Gross - Employee PF - Professional Tax

PRO-RATA (attendance-based):
  Payable Days       = Attended + Paid Leaves
  Total Working Days = Business days in month
  Each component     = component * (Payable Days / Total Days)

EMPLOYER COST = Wage (full monthly)
```

---

## 9. Login ID Generation Algorithm

```
Format: [CompanyPrefix][NameInitials][JoiningYear][SerialNumber]

CompanyPrefix = First 2 letters of company name (uppercase)
NameInitials  = First 2 letters of first name + First 2 letters of last name (uppercase)
JoiningYear   = 4-digit year of joining
SerialNumber  = 4-digit zero-padded sequential number for that year

Example: Company "Odoo India", Employee "John Doe", joined 2022, 1st employee
  CompanyPrefix = OI
  NameInitials  = JODO
  JoiningYear   = 2022
  SerialNumber  = 0001
  Result        = OIJODO20220001
```

---

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph Docker["Docker Compose"]
        PG["PostgreSQL 16 on Port 5432 with pgdata Volume"]
    end

    subgraph Local["Local Development"]
        FE["Vite Dev Server on Port 5173"]
        BE["Express Server on Port 5000"]
    end

    FE -->|"API Proxy"| BE
    BE -->|"pg connection"| PG
```

### docker-compose.yml Services
| Service | Image | Port | Notes |
|---------|-------|------|-------|
| `postgres` | postgres:16-alpine | 5432 | Persistent volume, init scripts |

### Environment Variables
```
# Backend (.env)
PORT=5000
DATABASE_URL=postgresql://empay:empay123@localhost:5432/empay_db
JWT_SECRET=your-strong-random-secret
JWT_EXPIRES_IN=24h
BCRYPT_SALT_ROUNDS=12

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

---

## 11. Project Directory Structure

```
EmPay/
├── docker-compose.yml
├── .env.example
│
├── server/                          # Backend
│   ├── package.json
│   ├── src/
│   │   ├── index.js                 # Express entry point
│   │   ├── config/
│   │   │   ├── db.js                # pg Pool configuration
│   │   │   └── env.js               # Environment variable loader
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification
│   │   │   ├── rbac.js              # Role-based access middleware
│   │   │   └── validate.js          # Zod schema validation
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── employee.routes.js
│   │   │   ├── attendance.routes.js
│   │   │   ├── timeoff.routes.js
│   │   │   ├── payroll.routes.js
│   │   │   ├── reports.routes.js
│   │   │   └── settings.routes.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── employee.service.js
│   │   │   ├── attendance.service.js
│   │   │   ├── timeoff.service.js
│   │   │   ├── payroll.service.js
│   │   │   ├── reports.service.js
│   │   │   └── settings.service.js
│   │   ├── utils/
│   │   │   ├── loginId.js           # Login ID generator
│   │   │   ├── password.js          # Password generator + hasher
│   │   │   ├── salary.js            # Salary computation engine
│   │   │   └── mailer.js            # Nodemailer transport
│   │   └── schemas/
│   │       ├── auth.schema.js       # Zod schemas for auth
│   │       ├── employee.schema.js
│   │       ├── attendance.schema.js
│   │       ├── timeoff.schema.js
│   │       └── payroll.schema.js
│   └── sql/
│       ├── 001_init.sql             # Core tables
│       ├── 002_seed.sql             # Sample data (optional)
│       └── 003_indexes.sql          # Performance indexes
│
├── client/                          # Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css                # Tailwind + CSS variables
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useApi.js
│   │   ├── api/
│   │   │   ├── client.js            # Axios/fetch wrapper
│   │   │   ├── auth.api.js
│   │   │   ├── employee.api.js
│   │   │   ├── attendance.api.js
│   │   │   ├── timeoff.api.js
│   │   │   ├── payroll.api.js
│   │   │   ├── reports.api.js
│   │   │   └── settings.api.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── DashboardLayout.jsx
│   │   │   ├── common/
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── StatusBadge.jsx
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   └── DateNavigator.jsx
│   │   │   ├── employees/
│   │   │   ├── attendance/
│   │   │   ├── timeoff/
│   │   │   ├── payroll/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Employees.jsx
│   │   │   ├── EmployeeDetail.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── TimeOff.jsx
│   │   │   ├── Payroll.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Settings.jsx
│   │   └── utils/
│   │       ├── roles.js             # Role constants and permissions
│   │       └── formatters.js        # Currency, date formatters
│   └── public/
│       └── empay-logo.svg
│
└── README.md
```

---

## 12. Inter-Module Dependencies

```mermaid
graph TD
    AUTH["Auth Module"] -->|"user_id and role"| ALL["All Modules"]
    
    EMP["Employee Module"] -->|"employee_id and salary_structure"| PAY["Payroll Module"]
    EMP -->|"employee_id"| ATT["Attendance Module"]
    EMP -->|"employee_id"| TO["Time-Off Module"]
    
    ATT -->|"worked_days count"| PAY
    TO -->|"paid_leave count"| PAY
    
    PAY -->|"payslip_data"| REP["Reports Module"]
    
    SET["Settings Module"] -->|"role_permissions"| AUTH
```

**Critical Path**: `Employee -> Attendance + Time-Off -> Payroll -> Reports`

This means:
1. Employees must be created first (with salary structure defined)
2. Attendance must be tracked daily
3. Time-off requests must be processed
4. Only then can payroll be computed accurately
5. Reports aggregate payroll data across months

---

## 13. Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| No ORM | Raw SQL with `pg` | Hackathon requirement; better control over queries |
| JWT over Sessions | Stateless auth | Simpler, no session store needed |
| Zod over Joi | Zod validation | TypeScript-friendly, smaller bundle, modern |
| Recharts over Chart.js | Recharts | Native React components, easier integration |
| Tailwind with CSS vars | CSS variables | Easy theme switching, consistent design tokens |
| Monorepo structure | `/server` + `/client` | Single repo, shared docker-compose |
| Login ID is deterministic | Algorithm-based | No lookup needed, follows company naming convention |
| Salary is attendance-based | Pro-rata computation | Matches real-world payroll practices |

---

## 14. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| **Response Time** | Less than 500ms for all API calls |
| **Concurrent Users** | 50+ simultaneous users |
| **Data Integrity** | ACID transactions for payroll |
| **Security** | OWASP Top 10 compliance |
| **Browser Support** | Chrome, Firefox, Edge (latest) |
| **Accessibility** | WCAG 2.1 AA minimum |
