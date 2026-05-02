/**
 * Database Seeder
 * Populates the database with sample data for development.
 * Usage: npm run db:seed
 */
const { pool } = require('./db');
const AuthService = require('../services/auth.service');
const EmployeeService = require('../services/employee.service');
const TimeOffService = require('../services/timeoff.service');
const { hashPassword } = require('../utils/password');

async function seed() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Clear existing data
    await pool.query('TRUNCATE companies, users, employees, attendance, payruns, payslips, time_off_types, time_off_balances, time_off_requests CASCADE');
    console.log('🧹 Cleared existing data');

    // 2. Create Admin & Company
    console.log('🏢 Creating company and admin...');
    const adminData = await AuthService.signup({
      company_name: 'Odoo India',
      name: 'Admin User',
      email: 'admin@odoo.com',
      phone: '9876543210',
      password: 'Password@123',
    });
    const companyId = adminData.company.id;
    const adminEmployeeId = adminData.employee.id;

    // 3. Ensure Leave Types exist
    console.log('📅 Initializing time off types...');
    let types = await TimeOffService.getTypes(companyId);
    if (types.length === 0) {
      await TimeOffService.initializeDefaultTypes(companyId);
      types = await TimeOffService.getTypes(companyId);
    }
    const ptoType = types.find(t => t.name === 'Paid Time Off');
    const sickType = types.find(t => t.name === 'Sick Leave');

    // 4. Create Employees
    console.log('👥 Creating employees...');
    const employeeData = [
      { first_name: 'Alice', last_name: 'Johnson', email: 'alice@odoo.com', phone: '9000000001', job_position: 'Software Engineer', department: 'R&D', location: 'Gandhinagar', role: 'employee' },
      { first_name: 'Bob', last_name: 'Smith', email: 'bob@odoo.com', phone: '9000000002', job_position: 'Product Manager', department: 'Product', location: 'Gandhinagar', role: 'employee' },
      { first_name: 'Charlie', last_name: 'Davis', email: 'charlie@odoo.com', phone: '9000000003', job_position: 'HR Specialist', department: 'HR', location: 'Gandhinagar', role: 'hr_officer' },
      { first_name: 'Diana', last_name: 'Prince', email: 'diana@odoo.com', phone: '9000000004', job_position: 'Accountant', department: 'Finance', location: 'Gandhinagar', role: 'payroll_officer' },
    ];

    const createdEmployees = [];
    console.log('\n🔐 --- SEED CREDENTIALS ---');
    for (const emp of employeeData) {
      const result = await EmployeeService.create(companyId, {
        ...emp,
        manager_id: adminEmployeeId,
        date_of_joining: '2026-01-01'
      });
      console.log(`👤 ${emp.first_name} (${emp.role}): ${result.loginId} / ${result.generatedPassword}`);
      
      createdEmployees.push({ id: result.employee.id, name: emp.first_name });
      
      await EmployeeService.updateSalary(result.employee.id, {
        monthly_wage: 45000 + (Math.random() * 20000),
        working_days: 22,
      });
    }
    console.log('---------------------------\n');

    // 5. Seed Attendance (Last 15 business days)
    console.log('⏰ Seeding attendance...');
    for (let i = 0; i < 15; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const day = date.getDay();
      if (day === 0 || day === 6) continue;

      const dateStr = date.toISOString().split('T')[0];
      for (const emp of createdEmployees) {
        if (Math.random() < 0.1) continue;

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
    }

    // 6. Seed Leave Requests
    console.log('🏖️ Seeding leaves...');
    for (const emp of createdEmployees) {
      // Approved PTO
      await pool.query(
        `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, allocation_days, status, note)
         VALUES ($1, $2, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '7 days', 3, 'approved', 'Vacation')`,
        [emp.id, ptoType.id]
      );
      // Update balance
      await pool.query(
        `UPDATE time_off_balances SET used = used + 3 
         WHERE employee_id = $1 AND time_off_type_id = $2 AND year = 2026`,
        [emp.id, ptoType.id]
      );

      // Pending Sick Leave
      await pool.query(
        `INSERT INTO time_off_requests (employee_id, time_off_type_id, start_date, end_date, allocation_days, status, note)
         VALUES ($1, $2, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '11 days', 1, 'pending', 'Feeling unwell')`,
        [emp.id, sickType.id]
      );
    }

    console.log('✅ Seeding completed!');
    console.log('Admin: admin@odoo.com / Password@123');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    await pool.end();
  }
}

seed();
