# EmPay – Frontend Structure & Design Guide

## 1. Routing Map

| Path | Page | Access |
|------|------|--------|
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/dashboard` | DashboardLayout wrapper | Auth required |
| `/dashboard/employees` | Employees grid (default) | All |
| `/dashboard/employees/:id` | Employee detail | All (view-only for Employee role) |
| `/dashboard/attendance` | Attendance logs | All |
| `/dashboard/time-off` | Time off management | All |
| `/dashboard/payroll` | Payroll (dashboard/payrun tabs) | Admin, Payroll Officer |
| `/dashboard/reports` | Reports generation | Admin, Payroll Officer |
| `/dashboard/settings` | User role management | Admin only |
| `/dashboard/company` | Company details | Admin only |
| `/dashboard/profile` | My Profile | All |

### Route Guard Logic
```jsx
// ProtectedRoute — redirects to /login if no token
// RoleRoute — hides route if user role not in allowedRoles[]
// Sidebar items conditionally rendered based on role + permissions
```

---

## 2. Component Hierarchy

```
App.jsx
├── Login.jsx
├── Signup.jsx
└── DashboardLayout.jsx
    ├── Sidebar.jsx
    ├── Navbar.jsx (sticky top)
    └── <Outlet/> (page content)
        ├── Employees.jsx
        │   ├── EmployeeCard.jsx (grid of cards)
        │   ├── NewEmployeeModal.jsx
        │   └── SearchBar.jsx
        ├── EmployeeDetail.jsx
        │   ├── EmployeeHeader.jsx (avatar, name, job, contact)
        │   ├── ResumeTab.jsx (about + skills/certs)
        │   ├── PrivateInfoTab.jsx (personal + bank details)
        │   ├── SalaryInfoTab.jsx (wage + components + deductions)
        │   └── SecurityTab.jsx (password change)
        ├── Attendance.jsx
        │   ├── DateNavigator.jsx (arrows + date picker)
        │   ├── AttendanceTable.jsx (admin: all employees)
        │   └── AttendanceSummary.jsx (employee: own stats)
        ├── TimeOff.jsx
        │   ├── LeaveBalanceCards.jsx
        │   ├── TimeOffTable.jsx (requests list)
        │   ├── NewTimeOffModal.jsx
        │   └── AllocationModal.jsx (admin/HR)
        ├── Payroll.jsx
        │   ├── PayrollDashboard.jsx
        │   │   ├── WarningsCard.jsx
        │   │   ├── PayrunInfoCard.jsx
        │   │   ├── EmployerCostChart.jsx
        │   │   └── EmployeeCountChart.jsx
        │   ├── PayrunList.jsx
        │   └── PayslipDetail.jsx
        │       ├── WorkedDaysTab.jsx
        │       └── SalaryComputationTab.jsx
        ├── Reports.jsx
        │   ├── ReportForm.jsx (employee + year selectors)
        │   └── SalaryStatementPrint.jsx
        ├── Settings.jsx
        │   └── UserRoleTable.jsx
        └── Profile.jsx (own profile = EmployeeDetail in edit mode)
```

---

## 3. Design System (CSS Variables)

```css
/* index.css — Theme tokens */
:root {
  /* Primary palette */
  --color-primary: #7C3AED;        /* Purple accent */
  --color-primary-hover: #6D28D9;
  --color-primary-light: #EDE9FE;

  /* Status colors */
  --color-success: #10B981;         /* Green — checked in */
  --color-warning: #F59E0B;         /* Yellow — absent */
  --color-danger: #EF4444;          /* Red — checked out / reject */
  --color-info: #3B82F6;            /* Blue — on leave / info */

  /* Backgrounds */
  --bg-body: #0F172A;               /* Dark navy */
  --bg-sidebar: #1E293B;            /* Sidebar dark */
  --bg-card: #1E293B;               /* Card surfaces */
  --bg-card-hover: #334155;         /* Card hover */
  --bg-input: #0F172A;              /* Input fields */
  --bg-modal: #1E293B;              /* Modal overlay bg */

  /* Text */
  --text-primary: #F8FAFC;          /* White text */
  --text-secondary: #94A3B8;        /* Muted text */
  --text-accent: #C084FC;           /* Purple accent text */

  /* Borders */
  --border-color: #334155;
  --border-radius: 12px;
  --border-radius-sm: 8px;

  /* Spacing */
  --sidebar-width: 240px;
  --navbar-height: 64px;

  /* Shadows */
  --shadow-card: 0 4px 6px -1px rgba(0,0,0,0.3);
  --shadow-modal: 0 25px 50px -12px rgba(0,0,0,0.5);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
}
```

### Typography
- **Font**: `Inter` from Google Fonts (fallback: system-ui, sans-serif)
- **Headings**: 600 weight, `--text-primary`
- **Body**: 400 weight, `--text-secondary`
- **Labels**: 500 weight, uppercase, letter-spacing 0.05em

### Tailwind Config Extensions
```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-light': 'var(--color-primary-light)',
        surface: 'var(--bg-card)',
        'surface-hover': 'var(--bg-card-hover)',
        body: 'var(--bg-body)',
        sidebar: 'var(--bg-sidebar)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { card: 'var(--border-radius)' },
    },
  },
};
```

---

## 4. Page Specifications

### 4.1 Login Page
- Centered card on dark background
- Fields: Login ID / Email, Password
- Purple gradient "SIGN IN" button
- Link: "Don't have an Account? Sign Up"
- Validation: Zod client-side, error toast on failure

### 4.2 Signup Page
- Company Name + Upload Logo (icon button)
- Fields: Name, Email, Phone, Password, Confirm Password
- Purple "Sign Up" button
- Link: "Already have an account? Sign In"
- On success: creates company + admin user, redirects to dashboard

### 4.3 Dashboard Layout
- **Sidebar** (left, fixed, 240px): Company logo/name at top, nav items below
  - Items: Employees, Attendance, Time Off, Payroll*, Reports*, Settings*, Company*
  - Active item: purple left border + bg highlight
  - *Conditionally shown based on role/permissions
- **Navbar** (top, sticky, 64px): 
  - Right side: Status dot (red=out, green=in) + "Check In/Out" button + Avatar dropdown
  - Avatar dropdown: "My Profile", "Log Out"

### 4.4 Employees Page (default tab)
- Top bar: "NEW" button (purple, Admin/HR only) + Search bar
- Grid layout (3 columns) of employee cards
- **Each card**: Profile picture, name, job position
  - Top-right corner status indicator:
    - 🟢 Green dot = present (checked in)
    - ✈️ Airplane icon = on approved leave
    - 🟡 Yellow dot = absent (no leave, not checked in)
- Cards are clickable → navigates to `/dashboard/employees/:id`
- **New Employee Modal**: Fields for first name, last name, email → auto-generates loginId + password + sends email

### 4.5 Employee Detail Page
- **Header section**: Avatar, Name (large), Login ID, email, phone, mobile on left; Company, Department, Manager, Location on right
- **4 Tabs**: Resume | Private Info | Salary Info* | Security
  - *Salary Info visible only to Admin and Payroll Officer

#### Resume Tab (two-column layout)
- Left column: About, What I love about my job, My interests and hobbies (text areas)
- Right column: Skills list (+ Add Skill button), Certifications list (+ Add Certification button)

#### Private Info Tab
- Left column: Date of Birth, Address, Nationality, Gender, Marital Status, Date of Joining
- Right column (Bank Details): Account Number, Bank Name, IFSC Code, PAN No, UAN No, Emp Code

#### Salary Info Tab
- Top: Monthly Wage input, Yearly Wage (auto = monthly × 12), Working Days/week, Break Time
- **Salary Components table**: Name | Amount | per month | Percentage
  - Basic Salary: 50% of wage
  - HRA: 50% of basic
  - Standard Allowance: Rs.4167 fixed
  - Performance Bonus: 8.33% of basic
  - Leave Travel Allowance: 8.333% of basic
  - Fixed Allowance: wage - sum(all above) — auto-calculated
- **PF Contribution**: Employee (12% of basic) + Employer (12% of basic)
- **Tax**: Professional Tax Rs.200/month
- All values auto-recalculate when wage changes

#### Security Tab
- Login ID (read-only, auto-populated)
- Old Password, New Password, Confirm Password
- "Reset Password" button

### 4.6 Attendance Page

#### For Admin/HR/Payroll Officer
- Sub-navbar: ← → arrows, Date dropdown, Day label, Search bar
- Table: Employee | Check In | Check Out | Work Hours | Extra Hours
- Shows all employees for selected date

#### For Employees
- Sub-navbar: ← → arrows, Month/Year selector
- Stats bar: Days Present count, Leaves Remaining, Total Working Days
- Table: Date | Check In | Check Out | Work Hours | Extra Hours

### 4.7 Time Off Page

#### For Admin/HR Officer
- Sub-tabs: "Time Off" | "Allocation"
- Balance cards at top: "Paid Time Off — X Days Available" | "Sick Time Off — Y Days Available"
- Requests table: Name | Start Date | End Date | Time Off Type | Status | Actions (Approve ✅ / Reject ❌)
- "NEW" button → opens allocation modal for admin/HR

#### For Employees
- Balance cards at top (own balances)
- Own requests table: Start Date | End Date | Type | Status
- "NEW" button → **Time Off Request Modal**:
  - Employee (auto-detected, read-only)
  - Time Off Type dropdown (Paid Time Off, Sick Leave, Unpaid Leave)
  - Validity Period: Start Date → End Date
  - Allocation (days)
  - Attachment upload (for sick leave)
  - Submit / Discard buttons

### 4.8 Payroll Page (Admin/Payroll Officer only)

#### Sub-tabs: Dashboard | Payrun

#### Dashboard Tab
- **Warnings card**: "X Employee without Bank A/c", "Y Employee without Manager" (clickable links)
- **Payrun card**: List of recent payruns with payslip counts
- **Employer Cost chart** (Recharts BarChart): Monthly/Annually toggle
- **Employee Count chart** (Recharts BarChart): Monthly/Annually toggle

#### Payrun Tab
- "Payrun" button (purple) + "Validate" button
- Payrun summary row: name, employer cost, gross, net, status badge
- Payslip table: Pay Period | Employee | Employer Cost | Basic Wage | Gross Wage | Net Wage | Status
- Status badge: green "Done" when validated

#### Payslip Detail (on click)
- Header: Employee name, Payrun name, Salary Structure, Period
- Action buttons: New Payslip | Compute | Validate | Cancel | Print
- **Worked Days tab**: Type (Attendance, Paid Time Off) | Days | Amount
- **Salary Computation tab**: Rule Name | Rate % | Amount
  - Lists all components (basic through fixed allowance) as positive
  - Gross subtotal
  - PF Employee, PF Employer, Professional Tax as negative (deductions)
  - Net Amount at bottom
- **Print**: Opens printable payslip PDF format with company logo, employee details, worked days, earnings vs deductions table, total net payable with amount in words

### 4.9 Reports Page (Admin/Payroll Officer only)
- "Salary Statement Report" heading + "Print" button
- Form: Employee Name dropdown, Year dropdown
- On generate → displays **Salary Statement Report** with:
  - Company name, Employee name, Designation, Date of Joining, Salary Effective From
  - Table: Salary Components | Monthly Amount | Yearly Amount
  - Earnings section (Basic, HRA, etc.)
  - Deductions section (PF, Professional Tax, TDS)
  - Net Salary row (monthly + yearly)
- Print button generates PDF

### 4.10 Settings Page (Admin only)
- "User Setting" heading
- Table: User Name | Login ID | Email | Role (dropdown)
- Role dropdown options: Employee, Admin, HR Officer, Payroll Officer
- Changes save on selection (or with explicit Save button)

---

## 5. State Management

```jsx
// AuthContext provides:
{
  user: { id, loginId, email, role, isPasswordChanged },
  employee: { id, firstName, lastName, profilePicture },
  company: { id, name, logoUrl, prefix },
  permissions: { employees, attendance, timeOff, payroll, reports, settings, company },
  token: "jwt-string",
  isCheckedIn: boolean,
  login: (credentials) => {},
  logout: () => {},
  toggleCheckIn: () => {},
}
```

---

## 6. API Client Pattern

```js
// api/client.js
const API_BASE = import.meta.env.VITE_API_URL;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });
  if (res.status === 401) { /* redirect to login */ }
  return res.json();
}

export const api = {
  get: (url) => request(url),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url, data) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url) => request(url, { method: 'DELETE' }),
  upload: (url, formData) => request(url, { method: 'POST', body: formData, headers: {} }),
};
```

---

## 7. Key UI Interactions

| Interaction | Behavior |
|-------------|----------|
| Check In click | POST `/attendance/check-in`, dot turns green, button text changes to "Check Out", timer starts |
| Check Out click | PUT `/attendance/check-out`, dot turns red, shows duration worked |
| Employee card click | Navigate to detail page (view-only for Employee role) |
| Avatar click | Toggle dropdown (My Profile, Log Out) |
| Wage input change | Auto-recalculates all salary components in real-time (client-side) |
| Payrun button | POST creates payrun, then POST compute generates all payslips |
| Print payslip | Uses react-to-print to render hidden print-formatted component |
| Approve/Reject leave | PUT request, updates status badge, recalculates balances |

---

## 8. Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (1024px+) | Sidebar visible, 3-column employee grid |
| Tablet (768-1023px) | Sidebar collapsible, 2-column grid |
| Mobile (below 768px) | Sidebar as drawer, 1-column grid, stacked tables |

---

## 9. Animation Guidelines

- **Page transitions**: fade-in 300ms on route change
- **Cards**: scale(1.02) + shadow elevation on hover (150ms)
- **Modals**: fade + slide-up entrance (300ms ease-out)
- **Status dots**: pulse animation for "checked in" state
- **Sidebar items**: left-border slide-in on active (200ms)
- **Charts**: animate on mount with 800ms stagger
- **Buttons**: subtle scale(0.98) on click + ripple effect
- **Tables**: row highlight on hover with bg transition
