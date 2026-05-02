const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth.service');
const TimeOffService = require('../services/timeoff.service');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { signupSchema, loginSchema, changePasswordSchema } = require('../schemas/auth.schema');
const { upload } = require('../middleware/upload');

// POST /api/auth/signup
router.post('/signup', upload.single('companyLogo'), validate(signupSchema), async (req, res) => {
  try {
    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;
    const result = await AuthService.signup({ ...req.validatedBody, logoUrl });

    // Initialize default time-off types for the new company
    await TimeOffService.initializeDefaultTypes(result.company.id);

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const result = await AuthService.login(req.validatedBody);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, validate(changePasswordSchema), async (req, res) => {
  try {
    const result = await AuthService.changePassword(req.user.id, req.user.role, req.validatedBody);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
  }
});

module.exports = router;
