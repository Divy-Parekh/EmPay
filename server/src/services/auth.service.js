const CompanyModel = require('../models/company.model');
const UserModel = require('../models/user.model');
const EmployeeModel = require('../models/employee.model');
const PermissionModel = require('../models/permission.model');
const SalaryModel = require('../models/salary.model');
const { generateLoginId } = require('../utils/loginId');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../middleware/auth');

const AuthService = {
  /**
   * Admin signup — creates company, user, employee, and permissions.
   */
  async signup({ company_name, name, email, phone, password, logo_url }) {
    const prefix = company_name.substring(0, 2).toUpperCase();

    // Create company first (without created_by since user doesn't exist yet)
    const company = await CompanyModel.create({ name: company_name, logo_url, prefix, created_by: null });

    // Split name into first and last
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

    // Generate login ID
    const loginId = await generateLoginId(prefix, firstName, lastName, company.id);

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      login_id: loginId, email, password_hash: passwordHash, role: 'admin', company_id: company.id,
    });

    // Update company with created_by (though CompanyModel.update doesn't support createdBy yet, we pass it anyway for future)
    await CompanyModel.update(company.id, { name: company_name, logo_url, created_by: user.id });

    // Create employee profile
    const employee = await EmployeeModel.create({
      user_id: user.id, company_id: company.id, first_name: firstName, last_name: lastName, email, phone,
    });

    // Create salary structure (default)
    await SalaryModel.create(employee.id);

    // Create admin permissions
    await PermissionModel.createForRole(user.id, 'admin');

    // Mark password as changed (admin set it themselves)
    await UserModel.updatePassword(user.id, passwordHash);

    const token = generateToken(user);
    const permissions = await PermissionModel.findByUser(user.id);

    return {
      user: { id: user.id, login_id: user.login_id, email: user.email, role: user.role, is_password_changed: true },
      employee: { id: employee.id, first_name: employee.first_name, last_name: employee.last_name, profile_picture: null },
      company: { id: company.id, name: company.name, logo_url: company.logo_url, prefix: company.prefix },
      permissions,
      token,
    };
  },

  /**
   * Login — validates credentials, returns user data + token.
   */
  async login({ login_id, email, password }) {
    let user;
    if (login_id) {
      user = await UserModel.findByLoginId(login_id);
    } else if (email) {
      user = await UserModel.findByEmail(email);
    }

    if (!user || !user.is_active) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'UNAUTHORIZED' });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'UNAUTHORIZED' });
    }

    const employee = await EmployeeModel.findByUserId(user.id);
    const company = await CompanyModel.findById(user.company_id);
    const permissions = await PermissionModel.findByUser(user.id);
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        login_id: user.login_id,
        email: user.email,
        role: user.role,
        is_password_changed: user.is_password_changed,
      },
      employee: employee ? {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        profile_picture: employee.profile_picture,
      } : null,
      company: company ? {
        id: company.id,
        name: company.name,
        logo_url: company.logo_url,
        prefix: company.prefix,
      } : null,
      permissions: permissions || {},
      token,
    };
  },

  /**
   * Change password — for self or admin changing another user.
   */
  async changePassword(currentUserId, currentRole, { old_password, new_password, user_id }) {
    let targetUserId = currentUserId;

    // Admin can change other users' passwords without old password
    if (user_id && currentRole === 'admin') {
      targetUserId = user_id;
    } else {
      // Regular user must provide old password
      const user = await UserModel.findById(currentUserId);
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

      if (old_password) {
        const isMatch = await comparePassword(old_password, user.password_hash);
        if (!isMatch) {
          throw Object.assign(new Error('Old password is incorrect'), { status: 400, code: 'VALIDATION_ERROR' });
        }
      }
    }

    const passwordHash = await hashPassword(new_password);
    await UserModel.updatePassword(targetUserId, passwordHash);

    return { message: 'Password changed successfully' };
  },
};

module.exports = AuthService;
