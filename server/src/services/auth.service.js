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
  async signup({ companyName, name, email, phone, password, logoUrl }) {
    const prefix = companyName.substring(0, 2).toUpperCase();

    // Create company first (without created_by since user doesn't exist yet)
    const company = await CompanyModel.create({ name: companyName, logoUrl, prefix, createdBy: null });

    // Split name into first and last
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

    // Generate login ID
    const loginId = await generateLoginId(prefix, firstName, lastName, company.id);

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      loginId, email, passwordHash, role: 'admin', companyId: company.id,
    });

    // Update company with created_by
    await CompanyModel.update(company.id, { name: companyName });

    // Create employee profile
    const employee = await EmployeeModel.create({
      userId: user.id, companyId: company.id, firstName, lastName, email, phone,
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
      user: { id: user.id, loginId: user.login_id, email: user.email, role: user.role, isPasswordChanged: true },
      employee: { id: employee.id, firstName, lastName, profilePicture: null },
      company: { id: company.id, name: companyName, logoUrl, prefix },
      permissions,
      token,
    };
  },

  /**
   * Login — validates credentials, returns user data + token.
   */
  async login({ loginId, email, password }) {
    let user;
    if (loginId) {
      user = await UserModel.findByLoginId(loginId);
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
        loginId: user.login_id,
        email: user.email,
        role: user.role,
        isPasswordChanged: user.is_password_changed,
      },
      employee: employee ? {
        id: employee.id,
        firstName: employee.first_name,
        lastName: employee.last_name,
        profilePicture: employee.profile_picture,
      } : null,
      company: company ? {
        id: company.id,
        name: company.name,
        logoUrl: company.logo_url,
        prefix: company.prefix,
      } : null,
      permissions: permissions || {},
      token,
    };
  },

  /**
   * Change password — for self or admin changing another user.
   */
  async changePassword(currentUserId, currentRole, { oldPassword, newPassword, userId }) {
    let targetUserId = currentUserId;

    // Admin can change other users' passwords without old password
    if (userId && currentRole === 'admin') {
      targetUserId = userId;
    } else {
      // Regular user must provide old password
      const user = await UserModel.findByLoginId(
        (await UserModel.findById(currentUserId)).login_id
      );
      if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

      if (oldPassword) {
        const isMatch = await comparePassword(oldPassword, user.password_hash);
        if (!isMatch) {
          throw Object.assign(new Error('Old password is incorrect'), { status: 400, code: 'VALIDATION_ERROR' });
        }
      }
    }

    const passwordHash = await hashPassword(newPassword);
    await UserModel.updatePassword(targetUserId, passwordHash);

    return { message: 'Password changed successfully' };
  },
};

module.exports = AuthService;
