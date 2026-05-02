/**
 * Database Seeder
 * Populates the database with comprehensive sample data.
 * Usage: npm run db:seed
 */
const { pool } = require('./db');
const AuthService = require('../services/auth.service');
const EmployeeService = require('../services/employee.service');
const TimeOffService = require('../services/timeoff.service');
const PayrollService = require('../services/payroll.service');
const NotificationService = require('../services/notification.service');
const { hashPassword } = require('../utils/password');

async function seed() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');

    // 1. Clear existing data
    await pool.query(
      'TRUNCATE companies, users, employees, attendance, payruns, payslips, time_off_types, time_off_balances, time_off_requests, employee_skills, employee_certifications, salary_structures, notifications CASCADE'
    );
    console.log('🧹 Cleared existing data');

    // 2. Create Admin & Company
    console.log('🏢 Creating company and admin...');
    const adminData = await AuthService.signup({
      company_name: 'Odoo India',
      name: 'Aarav Patel',
      email: 'admin@odoo.com',
      phone: '9876543210',
      password: 'Password@123',
    });
    
    // Admin user becomes the system admin
    const companyId = adminData.company.id;
    const adminEmployeeId = adminData.employee.id;

    // 3. Initialize Time Off Types
    console.log('📅 Initializing time off types...');
    await TimeOffService.initializeDefaultTypes(companyId);
    const types = await TimeOffService.getTypes(companyId);
    const ptoType = types.find(t => t.name === 'Paid Time Off');
    const sickType = types.find(t => t.name === 'Sick Leave');

    // 3.1 Assign default balances to Admin (since signup doesn't do it automatically)
    const currentYear = new Date().getFullYear();
    for (const type of types) {
      if (type.default_days > 0) {
        await pool.query(
          'INSERT INTO time_off_balances (employee_id, time_off_type_id, total_allocated, year) VALUES ($1, $2, $3, $4)',
          [adminEmployeeId, type.id, type.default_days, currentYear]
        );
      }
    }

    // Add Admin to createdEmployees so they get leave balances/attendance seeded too
    const createdEmployees = [{ 
      id: adminEmployeeId, 
      first_name: 'Aarav', 
      last_name: 'Patel', 
      email: 'admin@odoo.com',
      role: 'admin',
      loginId: adminData.user.login_id
    }];

    // 4. Create 10 Indian Employees (Covering all 4 roles)
    console.log('👥 Creating 10 detailed employees...');
    
    // Roles: 'admin', 'hr_officer', 'payroll_officer', 'employee'
    const employeeData = [
      { 
        first_name: 'Ananya', last_name: 'Sharma', email: 'ananya.hr@odoo.com', phone: '9000000001', 
        job_position: 'HR Manager', department: 'Human Resources', location: 'Gandhinagar', role: 'hr_officer',
        gender: 'female', marital_status: 'married', pan_number: 'ABCDE1234F',
        about: 'Passionate about building great teams.', skills: [{name: 'Recruitment', level: 'Expert'}],
        hasBank: true
      },
      { 
        first_name: 'Rohan', last_name: 'Verma', email: 'rohan.payroll@odoo.com', phone: '9000000002', 
        job_position: 'Payroll Specialist', department: 'Finance', location: 'Gandhinagar', role: 'payroll_officer',
        gender: 'male', marital_status: 'single',
        skills: [{name: 'Accounting', level: 'Expert'}, {name: 'Excel', level: 'Advanced'}],
        hasBank: true, managerIndex: 0 // Ananya is manager
      },
      { 
        first_name: 'Priya', last_name: 'Singh', email: 'priya.dev@odoo.com', phone: '9000000003', 
        job_position: 'Senior Software Engineer', department: 'Engineering', location: 'Pune', role: 'employee',
        gender: 'female', marital_status: 'single', bank_name: 'HDFC Bank', bank_acc_number: '1234567890', ifsc_code: 'HDFC0001234',
        about: 'Full-stack developer.', skills: [{name: 'React', level: 'Expert'}, {name: 'Node.js', level: 'Advanced'}],
        hasBank: true, managerIndex: null // Admin is manager
      },
      { 
        first_name: 'Vikram', last_name: 'Rao', email: 'vikram.qa@odoo.com', phone: '9000000004', 
        job_position: 'QA Tester', department: 'Engineering', location: 'Pune', role: 'employee',
        gender: 'male', marital_status: 'married',
        skills: [{name: 'Manual Testing', level: 'Intermediate'}, {name: 'Selenium', level: 'Beginner'}],
        hasBank: false, managerIndex: 2 // Priya is manager
      },
      { 
        first_name: 'Neha', last_name: 'Gupta', email: 'neha.design@odoo.com', phone: '9000000005', 
        job_position: 'UX Designer', department: 'Design', location: 'Gandhinagar', role: 'employee',
        gender: 'female', marital_status: 'single', pan_number: 'XYZAB9876C',
        skills: [{name: 'Figma', level: 'Expert'}, {name: 'UI/UX', level: 'Advanced'}],
        hasBank: true, managerIndex: null
      },
      { 
        first_name: 'Arjun', last_name: 'Deshmukh', email: 'arjun.sales@odoo.com', phone: '9000000006', 
        job_position: 'Sales Executive', department: 'Sales', location: 'Mumbai', role: 'employee',
        gender: 'male', marital_status: 'married', bank_name: 'ICICI Bank', bank_acc_number: '0987654321', ifsc_code: 'ICIC0000987',
        about: 'Target-driven sales professional.',
        hasBank: true, managerIndex: null
      },
      { 
        first_name: 'Kavya', last_name: 'Nair', email: 'kavya.support@odoo.com', phone: '9000000007', 
        job_position: 'Customer Support Rep', department: 'Support', location: 'Gandhinagar', role: 'employee',
        gender: 'female', marital_status: 'single',
        hasBank: false, managerIndex: 0
      },
      { 
        first_name: 'Rahul', last_name: 'Kapoor', email: 'rahul.marketing@odoo.com', phone: '9000000008', 
        job_position: 'Marketing Manager', department: 'Marketing', location: 'Mumbai', role: 'employee',
        gender: 'male', marital_status: 'married',
        skills: [{name: 'SEO', level: 'Expert'}, {name: 'Content Strategy', level: 'Advanced'}],
        hasBank: true, managerIndex: null
      },
      { 
        first_name: 'Sneha', last_name: 'Joshi', email: 'sneha.dev@odoo.com', phone: '9000000009', 
        job_position: 'Frontend Developer', department: 'Engineering', location: 'Pune', role: 'employee',
        gender: 'female', marital_status: 'single',
        skills: [{name: 'Vue.js', level: 'Intermediate'}, {name: 'CSS', level: 'Advanced'}],
        hasBank: true, managerIndex: 2 // Priya is manager
      },
      { 
        first_name: 'Aditya', last_name: 'Mehta', email: 'aditya.ops@odoo.com', phone: '9000000010', 
        job_position: 'Operations Analyst', department: 'Operations', location: 'Gandhinagar', role: 'employee',
        gender: 'male', marital_status: 'single', pan_number: 'PQRST5678D',
        hasBank: false, managerIndex: null
      }
    ];

    console.log('\n🔐 --- SEED CREDENTIALS ---');
    console.log(`👤 Admin: admin@odoo.com / Password@123`);

    for (let i = 0; i < employeeData.length; i++) {
      const emp = employeeData[i];
      
      // Determine manager ID
      let assignedManagerId = adminEmployeeId;
      if (emp.managerIndex !== undefined && emp.managerIndex !== null && createdEmployees[emp.managerIndex]) {
        assignedManagerId = createdEmployees[emp.managerIndex].id;
      }

      const result = await EmployeeService.create(companyId, {
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        phone: emp.phone,
        job_position: emp.job_position,
        department: emp.department,
        location: emp.location,
        role: emp.role,
        manager_id: assignedManagerId,
        date_of_joining: '2025-06-15'
      });
      
      console.log(`👤 ${emp.first_name} (${emp.role}): ${result.loginId} / ${result.generatedPassword}`);
      createdEmployees.push({ id: result.employee.id, ...emp, loginId: result.loginId });

      // Add detailed profile data
      await pool.query(
        `UPDATE employees SET 
          gender = $1, marital_status = $2, about = $3, 
          pan_number = $4, bank_name = $5, bank_acc_number = $6, ifsc_code = $7
         WHERE id = $8`,
        [
          emp.gender, emp.marital_status, emp.about || null, 
          emp.pan_number || null, 
          emp.hasBank ? (emp.bank_name || 'State Bank of India') : null,
          emp.hasBank ? (emp.bank_acc_number || Math.floor(Math.random() * 10000000000).toString()) : null,
          emp.hasBank ? (emp.ifsc_code || 'SBIN0001234') : null,
          result.employee.id
        ]
      );

      // Add skills
      if (emp.skills) {
        for (const skill of emp.skills) {
          await pool.query(
            `INSERT INTO employee_skills (employee_id, name, level) VALUES ($1, $2, $3)`,
            [result.employee.id, skill.name, skill.level]
          );
        }
      }

      // Add salary structure
      const monthlyWage = emp.role === 'hr_officer' ? 80000 : 
                          emp.role === 'payroll_officer' ? 75000 : 
                          50000 + (Math.random() * 30000);
      
      await EmployeeService.updateSalary(result.employee.id, {
        monthly_wage: Math.round(monthlyWage),
        working_days: 22,
      });

    }
    console.log('---------------------------\n');

    // 5. Seed Attendance & Time Offs
    console.log('⏰ Seeding attendance and leaves...');
    
    for (const emp of createdEmployees) {
      // 5.1 Attendance (Last 5 business days)
      for (let i = 0; i < 5; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const day = date.getDay();
        if (day === 0 || day === 6) continue;

        const dateStr = date.toISOString().split('T')[0];
        
        // Skip attendance randomly for some to simulate absent/leave
        if (Math.random() < 0.2) continue;

        const checkIn = new Date(date);
        checkIn.setHours(9, Math.floor(Math.random() * 30), 0);
        const checkOut = new Date(date);
        checkOut.setHours(18, Math.floor(Math.random() * 30), 0);
        const workHours = (checkOut - checkIn) / (1000 * 60 * 60);

        await pool.query(
          `INSERT INTO attendance (employee_id, date, check_in, check_out, work_hours, status)
           VALUES ($1, $2, $3, $4, $5, 'present')`,
          [emp.id, dateStr, checkIn, checkOut, workHours]
        );
      }

      // 5.2 Time Off Requests
      // Approved PTO
      await pool.query(
        `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, allocation_days, status, note)
         VALUES ($1, $2, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 3, 'approved', 'Family Vacation')`,
        [emp.id, ptoType.id]
      );
      await pool.query(
        `UPDATE time_off_balances SET used = used + 3 
         WHERE employee_id = $1 AND time_off_type_id = $2 AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [emp.id, ptoType.id]
      );

      // Random pending sick leave
      if (Math.random() > 0.5) {
        await pool.query(
          `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, allocation_days, status, note)
           VALUES ($1, $2, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '11 days', 1, 'pending', 'Medical Appointment')`,
          [emp.id, sickType.id]
        );
      }

      // 5.3 Notifications for the user
      const userRes = await pool.query('SELECT id FROM users WHERE login_id = $1', [emp.loginId]);
      const userId = userRes.rows[0].id;

      await NotificationService.createNotification(
        userId,
        'Welcome to EmPay',
        `Welcome aboard, ${emp.first_name}! Please complete your profile setup.`,
        'employee'
      );

      await NotificationService.createNotification(
        userId,
        'Time Off Approved',
        'Your Paid Time Off request for 3 days has been approved.',
        'timeoff'
      );

      if (Math.random() > 0.5) {
        await NotificationService.createNotification(
          userId,
          'Payslip Available',
          'Your payslip for the previous month has been generated and is ready to view.',
          'payroll'
        );
      }
    }

    console.log('✅ Comprehensive seeding completed successfully!');
    console.log('Use the credentials logged above to sign in as different roles.');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
