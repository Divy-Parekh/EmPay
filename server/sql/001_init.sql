-- EmPay HRMS - Database Initialization
-- All tables, indexes, and default seed data

-- ============================================
-- 1. COMPANIES
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  logo_url      TEXT,
  prefix        VARCHAR(10) NOT NULL,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id            VARCHAR(50) UNIQUE NOT NULL,
  email               VARCHAR(255) UNIQUE NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  role                VARCHAR(20) NOT NULL DEFAULT 'employee'
                      CHECK (role IN ('admin','employee','hr_officer','payroll_officer')),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_password_changed BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. EMPLOYEES
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
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
  manager_id      UUID REFERENCES employees(id) ON DELETE SET NULL,
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

-- ============================================
-- 4. EMPLOYEE SKILLS
-- ============================================
CREATE TABLE IF NOT EXISTS employee_skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  level       VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. EMPLOYEE CERTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS employee_certifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  issuer        VARCHAR(200),
  date_obtained DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. SALARY STRUCTURES
-- ============================================
CREATE TABLE IF NOT EXISTS salary_structures (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  monthly_wage          DECIMAL(12,2) NOT NULL DEFAULT 0,
  working_days          INTEGER NOT NULL DEFAULT 22,
  break_time_hrs        DECIMAL(4,2) DEFAULT 1.0,
  basic_pct             DECIMAL(5,2) DEFAULT 50.00,
  hra_pct               DECIMAL(5,2) DEFAULT 50.00,
  standard_allowance    DECIMAL(12,2) DEFAULT 4167.00,
  performance_bonus_pct DECIMAL(5,3) DEFAULT 8.330,
  leave_travel_pct      DECIMAL(5,3) DEFAULT 8.333,
  pf_rate               DECIMAL(5,2) DEFAULT 12.00,
  professional_tax      DECIMAL(12,2) DEFAULT 200.00,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. ATTENDANCE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in      TIMESTAMPTZ,
  check_out     TIMESTAMPTZ,
  work_hours    DECIMAL(5,2) DEFAULT 0,
  extra_hours   DECIMAL(5,2) DEFAULT 0,
  status        VARCHAR(20) DEFAULT 'present'
                CHECK (status IN ('present','absent','on_leave','half_day')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TIME OFF TYPES
-- ============================================
CREATE TABLE IF NOT EXISTS time_off_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(50) NOT NULL,
  is_paid       BOOLEAN DEFAULT TRUE,
  default_days  INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. TIME OFF BALANCES
-- ============================================
CREATE TABLE IF NOT EXISTS time_off_balances (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  time_off_type_id UUID NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
  total_allocated  DECIMAL(5,2) DEFAULT 0,
  used             DECIMAL(5,2) DEFAULT 0,
  year             INTEGER NOT NULL,
  UNIQUE(employee_id, time_off_type_id, year)
);

-- ============================================
-- 10. TIME OFF REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS time_off_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  time_off_type_id UUID NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  allocation_days  DECIMAL(5,2) NOT NULL,
  attachment_url   TEXT,
  note             TEXT,
  status           VARCHAR(20) DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  approved_by      UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. PAYRUNS
-- ============================================
CREATE TABLE IF NOT EXISTS payruns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  status        VARCHAR(20) DEFAULT 'draft'
                CHECK (status IN ('draft','computed','validated','cancelled')),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. PAYSLIPS
-- ============================================
CREATE TABLE IF NOT EXISTS payslips (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id           UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  total_working_days  DECIMAL(5,2) NOT NULL,
  attendance_days     DECIMAL(5,2) NOT NULL,
  paid_leave_days     DECIMAL(5,2) DEFAULT 0,
  unpaid_leave_days   DECIMAL(5,2) DEFAULT 0,
  payable_days        DECIMAL(5,2) NOT NULL,
  basic_amount        DECIMAL(12,2) NOT NULL,
  hra_amount          DECIMAL(12,2) NOT NULL,
  standard_allowance  DECIMAL(12,2) NOT NULL,
  performance_bonus   DECIMAL(12,2) NOT NULL,
  leave_travel        DECIMAL(12,2) NOT NULL,
  fixed_allowance     DECIMAL(12,2) NOT NULL,
  gross_wage          DECIMAL(12,2) NOT NULL,
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

-- ============================================
-- 13. USER PERMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS user_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employees   BOOLEAN DEFAULT TRUE,
  attendance  BOOLEAN DEFAULT TRUE,
  time_off    BOOLEAN DEFAULT TRUE,
  payroll     BOOLEAN DEFAULT FALSE,
  reports     BOOLEAN DEFAULT FALSE,
  settings    BOOLEAN DEFAULT FALSE,
  company     BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_timeoff_req_emp ON time_off_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_timeoff_req_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_timeoff_bal_emp ON time_off_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_payrun ON payslips(payrun_id);
CREATE INDEX IF NOT EXISTS idx_payslips_emp ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payruns_company ON payruns(company_id);
CREATE INDEX IF NOT EXISTS idx_skills_emp ON employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_certs_emp ON employee_certifications(employee_id);
