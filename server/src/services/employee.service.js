const UserModel = require('../models/user.model');
const EmployeeModel = require('../models/employee.model');
const SalaryModel = require('../models/salary.model');
const PermissionModel = require('../models/permission.model');
const CompanyModel = require('../models/company.model');
const { SkillModel, CertificationModel } = require('../models/skill.model');
const { generateLoginId } = require('../utils/loginId');
const { generatePassword, hashPassword } = require('../utils/password');
const { sendCredentialsEmail } = require('../utils/mailer');
const { computeFullSalary } = require('../utils/salary');
const TimeOffModel = require('../models/timeoff.model');

const EmployeeService = {
  async list(companyId, search) {
    return EmployeeModel.findByCompany(companyId, search);
  },

  async getById(id) {
    const employee = await EmployeeModel.findById(id);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });

    const skills = await SkillModel.findByEmployee(id);
    const certifications = await CertificationModel.findByEmployee(id);

    return { ...employee, skills, certifications };
  },

  async create(companyId, { firstName, lastName, email, phone, jobPosition, department, managerId, location, dateOfJoining }) {
    // Check duplicate email
    const existing = await UserModel.findByEmail(email);
    if (existing) throw Object.assign(new Error('Email already registered'), { status: 409, code: 'CONFLICT' });

    const company = await CompanyModel.findById(companyId);
    const prefix = company.prefix;

    // Generate login ID and password
    const loginId = await generateLoginId(prefix, firstName, lastName, companyId);
    const plainPassword = generatePassword();
    const passwordHash = await hashPassword(plainPassword);

    // Create user
    const user = await UserModel.create({
      loginId, email, passwordHash, role: 'employee', companyId,
    });

    // Create employee
    const employee = await EmployeeModel.create({
      userId: user.id, companyId, firstName, lastName, email, phone, dateOfJoining,
    });

    // Update optional fields
    if (jobPosition || department || managerId || location) {
      await EmployeeModel.update(employee.id, { jobPosition, department, managerId, location });
    }

    // Create default salary structure
    await SalaryModel.create(employee.id);

    // Create default permissions for employee role
    await PermissionModel.createForRole(user.id, 'employee');

    // Allocate default leave balances
    const currentYear = new Date().getFullYear();
    const timeOffTypes = await TimeOffModel.getTypes(companyId);
    for (const type of timeOffTypes) {
      if (type.default_days > 0) {
        await TimeOffModel.upsertBalance({
          employeeId: employee.id,
          timeOffTypeId: type.id,
          totalAllocated: type.default_days,
          year: currentYear,
        });
      }
    }

    // Send credentials email (non-blocking)
    sendCredentialsEmail(email, loginId, plainPassword, company.name);

    return {
      employee: { id: employee.id, firstName, lastName, email },
      loginId,
      generatedPassword: plainPassword, // Return so admin can see it too
      message: `Credentials sent to ${email}`,
    };
  },

  async update(id, fields) {
    return EmployeeModel.update(id, fields);
  },

  async updateResume(id, data) {
    return EmployeeModel.updateResume(id, data);
  },

  async updatePrivateInfo(id, data) {
    return EmployeeModel.updatePrivateInfo(id, data);
  },

  async delete(id) {
    const employee = await EmployeeModel.findById(id);
    if (!employee) throw Object.assign(new Error('Employee not found'), { status: 404 });
    // Delete cascades from user → employee → attendance, etc.
    const { query: dbQuery } = require('../config/db');
    await dbQuery('DELETE FROM users WHERE id = $1', [employee.user_id]);
    return { message: 'Employee deleted' };
  },

  // --- Salary ---
  async getSalary(employeeId) {
    const structure = await SalaryModel.findByEmployee(employeeId);
    if (!structure) throw Object.assign(new Error('Salary structure not found'), { status: 404 });
    const computed = computeFullSalary(structure);
    return { structure, computed };
  },

  async updateSalary(employeeId, data) {
    let structure = await SalaryModel.findByEmployee(employeeId);
    if (!structure) {
      structure = await SalaryModel.create(employeeId);
    }
    const updated = await SalaryModel.update(employeeId, data);
    const computed = computeFullSalary(updated);
    return { structure: updated, computed };
  },

  // --- Skills ---
  async addSkill(employeeId, data) {
    return SkillModel.create({ employeeId, ...data });
  },

  async removeSkill(id, employeeId) {
    const result = await SkillModel.delete(id, employeeId);
    if (!result) throw Object.assign(new Error('Skill not found'), { status: 404 });
    return result;
  },

  // --- Certifications ---
  async addCertification(employeeId, data) {
    return CertificationModel.create({ employeeId, ...data });
  },

  async removeCertification(id, employeeId) {
    const result = await CertificationModel.delete(id, employeeId);
    if (!result) throw Object.assign(new Error('Certification not found'), { status: 404 });
    return result;
  },
};

module.exports = EmployeeService;
