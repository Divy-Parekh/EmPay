const express = require('express');
const router = express.Router();
const SettingsService = require('../services/settings.service');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { upload } = require('../middleware/upload');

// GET /api/settings/users
router.get('/users', authenticate, rbac(['admin'], 'settings'), async (req, res) => {
  try {
    const users = await SettingsService.listUsers(req.user.company_id);
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/settings/users/:id/role
router.put('/users/:id/role', authenticate, rbac(['admin'], 'settings'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'employee', 'hr_officer', 'payroll_officer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid role' },
      });
    }
    const user = await SettingsService.updateUserRole(req.params.id, role);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/settings/users/:id/permissions
router.put('/users/:id/permissions', authenticate, rbac(['admin'], 'settings'), async (req, res) => {
  try {
    const result = await SettingsService.updateUserPermissions(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/settings/company
router.get('/company', authenticate, rbac(['admin'], 'company'), async (req, res) => {
  try {
    const company = await SettingsService.getCompany(req.user.company_id);
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/settings/company
router.put('/company', authenticate, rbac(['admin'], 'company'), upload.single('companyLogo'), async (req, res) => {
  try {
    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : undefined;
    const company = await SettingsService.updateCompany(req.user.company_id, {
      name: req.body.name,
      logoUrl,
    });
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
