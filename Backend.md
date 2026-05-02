# EmPay – Backend API & Database Schema

## 1. Database Schema (PostgreSQL)

### 1.1 Companies Table
```sql
CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  logo_url      TEXT,
  prefix        VARCHAR(10) NOT NULL,  -- e.g. "OI" for Odoo India
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 Users Table
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id      VARCHAR(50) UNIQUE NOT NULL,  -- e.g. OIJODO20220001
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'employee'
                CHECK (role IN ('admin','employee','hr_officer','payroll_officer')),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_password_changed BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 Employees Table
```sql
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  profile_picture TEXT,
  job_position    VARCHAR(100),
  department      VARCHAR(100),
  manager_id      UUID REFERENCES employees(id),
  location        VARCHAR(200),
  date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Resume fields
  about           TEXT,
  job_love        TEXT,
  interests       TEXT,
  -- Private info
  date_of_birth   DATE,
  address         TEXT,
  nationality     VARCHAR(100),
  gender          VARCHAR(20),
  marital_status  VARCHAR(30),
  -- Bank details
  bank_acc_number VARCHAR(50),
  bank_name       VARCHAR(100),
  ifsc_code       VARCHAR(20),
  pan_number      VARCHAR(20),
  uan_number      VARCHAR(30),
  emp_code        VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.4 Skills & Certifications
```sql
CREATE TABLE employee_skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  level       VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employee_certifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  issuer        VARCHAR(200),
  date_obtained DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 Salary Structure
```sql
CREATE TABLE salary_structures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  monthly_wage    DECIMAL(12,2) NOT NULL DEFAULT 0,
  working_days    INTEGER NOT NULL DEFAULT 22,
  break_time_hrs  DECIMAL(4,2) DEFAULT 1.0,
  -- Component percentages/values
  basic_pct             DECIMAL(5,2) DEFAULT 50.00,     -- % of wage
  hra_pct               DECIMAL(5,2) DEFAULT 50.00,     -- % of basic
  standard_allowance    DECIMAL(12,2) DEFAULT 4167.00,  -- fixed amount
  performance_bonus_pct DECIMAL(5,3) DEFAULT 8.330,     -- % of basic
  leave_travel_pct      DECIMAL(5,3) DEFAULT 8.333,     -- % of basic
  -- fixed_allowance is calculated: wage - sum(all above components)
  pf_rate               DECIMAL(5,2) DEFAULT 12.00,     -- % of basic
  professional_tax      DECIMAL(12,2) DEFAULT 200.00,   -- fixed monthly
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.6 Attendance
```sql
CREATE TABLE attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in      TIMESTAMPTZ,
  check_out     TIMESTAMPTZ,
  work_hours    DECIMAL(5,2) DEFAULT 0,
  extra_hours   DECIMAL(5,2) DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'present'
                CHECK (status IN ('present','absent','on_leave','half_day')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);
```

### 1.7 Time Off
```sql
CREATE TABLE time_off_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(50) NOT NULL,  -- 'Paid Time Off', 'Sick Leave', 'Unpaid Leave'
  is_paid       BOOLEAN DEFAULT TRUE,
  default_days  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE time_off_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  time_off_type_id UUID NOT NULL REFERENCES time_off_types(id),
  total_allocated DECIMAL(5,2) DEFAULT 0,
  used            DECIMAL(5,2) DEFAULT 0,
  remaining       DECIMAL(5,2) GENERATED ALWAYS AS (total_allocated - used) STORED,
  year            INTEGER NOT NULL,
  UNIQUE(employee_id, time_off_type_id, year)
);

CREATE TABLE time_off_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  time_off_type_id UUID NOT NULL REFERENCES time_off_types(id),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  allocation_days DECIMAL(5,2) NOT NULL,
  attachment_url  TEXT,
  note            TEXT,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  approved_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.8 Payroll
```sql
CREATE TABLE payruns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,      -- e.g. "Payrun Oct 2025"
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  status        VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN ('draft','computed','validated','cancelled')),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payslips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id       UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  -- Worked days breakdown
  total_working_days  DECIMAL(5,2) NOT NULL,
  attendance_days     DECIMAL(5,2) NOT NULL,
  paid_leave_days     DECIMAL(5,2) DEFAULT 0,
  unpaid_leave_days   DECIMAL(5,2) DEFAULT 0,
  payable_days        DECIMAL(5,2) NOT NULL,
  -- Salary amounts
  basic_amount        DECIMAL(12,2) NOT NULL,
  hra_amount          DECIMAL(12,2) NOT NULL,
  standard_allowance  DECIMAL(12,2) NOT NULL,
  performance_bonus   DECIMAL(12,2) NOT NULL,
  leave_travel        DECIMAL(12,2) NOT NULL,
  fixed_allowance     DECIMAL(12,2) NOT NULL,
  gross_wage          DECIMAL(12,2) NOT NULL,
  -- Deductions
  pf_employee         DECIMAL(12,2) NOT NULL,
  pf_employer         DECIMAL(12,2) NOT NULL,
  professional_tax    DECIMAL(12,2) NOT NULL,
  total_deductions    DECIMAL(12,2) NOT NULL,
  net_wage            DECIMAL(12,2) NOT NULL,
  employer_cost       DECIMAL(12,2) NOT NULL,
  status              VARCHAR(20) DEFAULT 'draft'
                      CHECK (status IN ('draft','computed','validated','cancelled')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payrun_id, employee_id)
);
```

### 1.9 User Permissions (Settings)
```sql
CREATE TABLE user_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employees     BOOLEAN DEFAULT TRUE,
  attendance    BOOLEAN DEFAULT TRUE,
  time_off      BOOLEAN DEFAULT TRUE,
  payroll       BOOLEAN DEFAULT FALSE,
  reports       BOOLEAN DEFAULT FALSE,
  settings      BOOLEAN DEFAULT FALSE,
  company       BOOLEAN DEFAULT FALSE,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.10 Indexes
```sql
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_login ON users(login_id);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_attendance_emp_date ON attendance(employee_id, date);
CREATE INDEX idx_timeoff_emp ON time_off_requests(employee_id);
CREATE INDEX idx_timeoff_status ON time_off_requests(status);
CREATE INDEX idx_payslips_payrun ON payslips(payrun_id);
CREATE INDEX idx_payslips_emp ON payslips(employee_id);
```

---

## 2. API Structure

### Base URL: `http://localhost:5000/api`

### 2.1 Auth Module

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/auth/signup` | No | — | Admin registers company |
| POST | `/auth/login` | No | — | Login with loginId/email + password |
| POST | `/auth/change-password` | Yes | All | Change own password |

#### POST `/auth/signup`
```json
// Request
{
  "companyName": "Odoo India",
  "name": "John Doe",
  "email": "john@odoo.com",
  "phone": "9876543210",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
// Also accepts: companyLogo (multipart file upload)

// Response 201
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "loginId": "OIJODO20260001", "email": "...", "role": "admin" },
    "company": { "id": "uuid", "name": "Odoo India", "prefix": "OI" },
    "token": "jwt-token"
  }
}
```

#### POST `/auth/login`
```json
// Request
{ "loginId": "OIJODO20260001", "password": "Password@123" }
// OR
{ "email": "john@odoo.com", "password": "Password@123" }

// Response 200
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "loginId": "...", "email": "...", "role": "admin", "isPasswordChanged": true },
    "employee": { "id": "uuid", "firstName": "...", "profilePicture": "..." },
    "company": { "id": "uuid", "name": "...", "logoUrl": "..." },
    "permissions": { "employees": true, "attendance": true, "payroll": true, ... },
    "token": "jwt-token"
  }
}
```

#### POST `/auth/change-password`
```json
// Request
{ "oldPassword": "...", "newPassword": "...", "confirmPassword": "..." }
// For admin changing others: { "userId": "uuid", "newPassword": "..." }

// Response 200
{ "success": true, "message": "Password changed successfully" }
```

---

### 2.2 Employee Module

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/employees` | Yes | All | List employees (company-scoped) |
| GET | `/employees/:id` | Yes | All | Get employee detail |
| POST | `/employees` | Yes | Admin, HR | Create employee |
| PUT | `/employees/:id` | Yes | Admin, HR | Update employee |
| DELETE | `/employees/:id` | Yes | Admin | Delete employee |
| PUT | `/employees/:id/resume` | Yes | Admin, HR, Self | Update resume |
| PUT | `/employees/:id/private-info` | Yes | Admin, HR, Self | Update private info |
| GET | `/employees/:id/status` | Yes | All | Get attendance status |
| POST | `/employees/:id/skills` | Yes | Admin, HR, Self | Add skill |
| DELETE | `/employees/:id/skills/:skillId` | Yes | Admin, HR, Self | Remove skill |
| POST | `/employees/:id/certifications` | Yes | Admin, HR, Self | Add certification |
| DELETE | `/employees/:id/certifications/:certId` | Yes | Admin, HR, Self | Remove certification |

#### POST `/employees` (Create Employee)
```json
// Request
{ "firstName": "Jane", "lastName": "Smith", "email": "jane@odoo.com" }

// Response 201 — system auto-generates loginId and password, sends email
{
  "success": true,
  "data": {
    "employee": { "id": "uuid", "firstName": "Jane", "lastName": "Smith", ... },
    "loginId": "OIJASM20260002",
    "message": "Credentials sent to jane@odoo.com"
  }
}
```

---

### 2.3 Salary Structure

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/employees/:id/salary` | Yes | Admin, Payroll | Get salary structure |
| PUT | `/employees/:id/salary` | Yes | Admin, Payroll | Update salary structure |

#### PUT `/employees/:id/salary`
```json
// Request
{
  "monthlyWage": 50000,
  "workingDays": 22,
  "breakTimeHrs": 1.0,
  "basicPct": 50,
  "hraPct": 50,
  "standardAllowance": 4167,
  "performanceBonusPct": 8.33,
  "leaveTravelPct": 8.333,
  "pfRate": 12,
  "professionalTax": 200
}

// Response 200 — returns computed values
{
  "success": true,
  "data": {
    "monthlyWage": 50000,
    "yearlyWage": 600000,
    "components": {
      "basic": { "pct": 50, "amount": 25000 },
      "hra": { "pct": 50, "ofBasic": true, "amount": 12500 },
      "standardAllowance": { "fixed": true, "amount": 4167 },
      "performanceBonus": { "pct": 8.33, "amount": 2082.50 },
      "leaveTravel": { "pct": 8.333, "amount": 2083.25 },
      "fixedAllowance": { "calculated": true, "amount": 4167.25 }
    },
    "deductions": {
      "pfEmployee": { "pct": 12, "amount": 3000 },
      "pfEmployer": { "pct": 12, "amount": 3000 },
      "professionalTax": { "amount": 200 }
    },
    "grossWage": 50000,
    "netWage": 46800
  }
}
```

---

### 2.4 Attendance Module

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/attendance/check-in` | Yes | All | Check in |
| PUT | `/attendance/check-out` | Yes | All | Check out |
| GET | `/attendance/my?date=YYYY-MM-DD` | Yes | All | Own attendance for date/month |
| GET | `/attendance/all?date=YYYY-MM-DD` | Yes | Admin, HR, Payroll | All employees for date |
| GET | `/attendance/summary?month=MM&year=YYYY` | Yes | All (own), Admin (all) | Monthly summary |

#### POST `/attendance/check-in`
```json
// Response 200
{
  "success": true,
  "data": { "id": "uuid", "date": "2026-05-02", "checkIn": "2026-05-02T09:00:00Z", "status": "present" }
}
```

#### GET `/attendance/my?month=05&year=2026`
```json
// Response 200
{
  "success": true,
  "data": {
    "records": [
      { "date": "2026-05-01", "checkIn": "09:00", "checkOut": "18:00", "workHours": 9, "extraHours": 1 },
      ...
    ],
    "summary": { "daysPresent": 18, "leavesRemaining": 6, "totalWorkingDays": 22 }
  }
}
```

---

### 2.5 Time-Off Module

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/time-off/types` | Yes | All | List leave types |
| GET | `/time-off/balances` | Yes | All (own), Admin/HR (all) | Leave balances |
| POST | `/time-off/requests` | Yes | All | Create leave request |
| GET | `/time-off/requests` | Yes | All (own), Admin/HR (all) | List requests |
| PUT | `/time-off/requests/:id/approve` | Yes | Admin, HR, Payroll | Approve request |
| PUT | `/time-off/requests/:id/reject` | Yes | Admin, HR, Payroll | Reject request |
| POST | `/time-off/allocate` | Yes | Admin, HR | Allocate leaves |

#### POST `/time-off/requests`
```json
// Request (multipart for attachment)
{
  "timeOffTypeId": "uuid",
  "startDate": "2026-05-13",
  "endDate": "2026-05-14",
  "allocationDays": 2,
  "note": "Family function"
}

// Response 201
{
  "success": true,
  "data": { "id": "uuid", "status": "pending", "employee": "Jane Smith", "type": "Paid Time Off", ... }
}
```

---

### 2.6 Payroll Module

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/payroll/dashboard` | Yes | Admin, Payroll | Dashboard stats |
| POST | `/payroll/payruns` | Yes | Admin, Payroll | Create payrun |
| GET | `/payroll/payruns` | Yes | Admin, Payroll | List payruns |
| GET | `/payroll/payruns/:id` | Yes | Admin, Payroll | Get payrun detail |
| POST | `/payroll/payruns/:id/compute` | Yes | Admin, Payroll | Generate all payslips |
| PUT | `/payroll/payruns/:id/validate` | Yes | Admin, Payroll | Validate payrun |
| PUT | `/payroll/payruns/:id/cancel` | Yes | Admin, Payroll | Cancel payrun |
| GET | `/payroll/payslips/:id` | Yes | Admin, Payroll | Get payslip detail |
| POST | `/payroll/payslips/:id/new` | Yes | Admin, Payroll | Generate individual payslip |
| PUT | `/payroll/payslips/:id/cancel` | Yes | Admin, Payroll | Cancel payslip |

#### GET `/payroll/dashboard`
```json
// Response 200
{
  "success": true,
  "data": {
    "warnings": {
      "missingBankAccount": [{ "id": "uuid", "name": "Jane Smith" }],
      "missingManager": [{ "id": "uuid", "name": "John Doe" }]
    },
    "payruns": [
      { "id": "uuid", "name": "Payrun Oct 2025", "payslipCount": 3 }
    ],
    "employerCost": {
      "monthly": [{ "month": "Jan 2025", "cost": 150000 }, ...],
      "yearly": [{ "year": 2025, "cost": 1800000 }]
    },
    "employeeCount": {
      "monthly": [{ "month": "Jan 2025", "count": 5 }, ...],
      "yearly": [{ "year": 2025, "count": 5 }]
    }
  }
}
```

#### POST `/payroll/payruns/:id/compute` — Payslip generation logic
```
For each employee in company:
  1. Get salary structure
  2. Count attendance_days in period
  3. Count paid_leave_days (approved paid time-off)
  4. Count unpaid_leave_days (approved unpaid time-off)
  5. total_working_days = business days in period
  6. payable_days = attendance_days + paid_leave_days
  7. ratio = payable_days / total_working_days
  8. Each component_amount = full_component * ratio
  9. gross = sum(all components)
  10. pf_employee = basic_amount * pf_rate%
  11. net = gross - pf_employee - professional_tax
  12. employer_cost = monthly_wage
  13. INSERT payslip
```

---

### 2.7 Reports Module

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/reports/salary-statement?employeeId=uuid&year=2025` | Yes | Admin, Payroll | Yearly salary report |

#### Response
```json
{
  "success": true,
  "data": {
    "employee": { "name": "...", "designation": "...", "dateOfJoining": "...", "salaryEffectiveFrom": "..." },
    "company": { "name": "...", "logoUrl": "..." },
    "components": [
      { "name": "Basic", "monthlyAmount": 25000, "yearlyAmount": 300000 },
      { "name": "HRA", "monthlyAmount": 12500, "yearlyAmount": 150000 },
      ...
    ],
    "deductions": [
      { "name": "PF Employee", "monthlyAmount": 3000, "yearlyAmount": 36000 },
      { "name": "PF Employer", "monthlyAmount": 3000, "yearlyAmount": 36000 },
      { "name": "Professional Tax", "monthlyAmount": 200, "yearlyAmount": 2400 },
      { "name": "TDS Deduction", "monthlyAmount": 0, "yearlyAmount": 0 }
    ],
    "netSalary": { "monthly": 46800, "yearly": 561600 }
  }
}
```

---

### 2.8 Settings Module

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/settings/users` | Yes | Admin | List all users with roles |
| PUT | `/settings/users/:id/role` | Yes | Admin | Update user role |
| PUT | `/settings/users/:id/permissions` | Yes | Admin | Update module permissions |
| GET | `/settings/company` | Yes | Admin | Get company details |
| PUT | `/settings/company` | Yes | Admin | Update company details |

---

## 3. Middleware Chain

```
Request → CORS → Rate Limit → JSON Parser → Auth (JWT verify) → RBAC (role check) → Validate (Zod) → Route Handler → Response
```

### Auth Middleware
```js
// Extracts JWT from Authorization header or cookie
// Attaches user { id, role, companyId } to req.user
```

### RBAC Middleware
```js
// Usage: rbac(['admin', 'hr_officer'])
// Checks req.user.role against allowed roles
// Also checks user_permissions table for module-level access
```

### Validate Middleware
```js
// Usage: validate(zodSchema)
// Validates req.body against Zod schema, returns 400 with errors on failure
```

---

## 4. Utility Functions

### Login ID Generator (`utils/loginId.js`)
```
Input: companyPrefix, firstName, lastName, joiningYear
1. prefix = companyPrefix (2 chars uppercase)
2. initials = firstName[0:2] + lastName[0:2] (uppercase)
3. year = joiningYear (4 digits)
4. serial = SELECT COUNT(*) FROM users WHERE company_id = X AND EXTRACT(YEAR FROM created_at) = Y → pad to 4 digits
5. return prefix + initials + year + serial
```

### Password Generator (`utils/password.js`)
```
Generate 12-char random string with uppercase + lowercase + digits + special chars
Hash with bcrypt (12 salt rounds)
```

### Salary Calculator (`utils/salary.js`)
```
Input: wage, salaryStructure, payableDays, totalWorkingDays
Output: { components[], deductions[], gross, net, employerCost }
All amounts pro-rated by (payableDays / totalWorkingDays)
```

---

## 5. Email Templates

### New Employee Credentials
```
Subject: Welcome to {companyName} - Your EmPay Login Credentials
Body:
  Hello {firstName},
  Your account has been created on EmPay.
  Login ID: {loginId}
  Password: {generatedPassword}
  Please login and change your password immediately.
  URL: {appUrl}
```

---

## 6. Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

Error Codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`
