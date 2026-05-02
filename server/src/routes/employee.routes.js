const express = require('express');
const router = express.Router();
const EmployeeService = require('../services/employee.service');
const { authenticate } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createEmployeeSchema, updateEmployeeSchema, updateResumeSchema,
        updatePrivateInfoSchema, salaryStructureSchema, skillSchema, certificationSchema } = require('../schemas/employee.schema');

// GET /api/employees
router.get('/', authenticate, async (req, res) => {
  try {
    const employees = await EmployeeService.list(req.user.company_id, req.query.search);
    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/employees/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const employee = await EmployeeService.getById(req.params.id);
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/employees
router.post('/', authenticate, rbac(['admin', 'hr_officer'], 'employees'), validate(createEmployeeSchema), async (req, res) => {
  try {
    const result = await EmployeeService.create(req.user.company_id, req.validatedBody);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { code: err.code, message: err.message } });
  }
});

// PUT /api/employees/:id
router.put('/:id', authenticate, rbac(['admin', 'hr_officer'], 'employees'), validate(updateEmployeeSchema), async (req, res) => {
  try {
    const employee = await EmployeeService.update(req.params.id, req.validatedBody);
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// DELETE /api/employees/:id
router.delete('/:id', authenticate, rbac(['admin']), async (req, res) => {
  try {
    const result = await EmployeeService.delete(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/employees/:id/resume
router.put('/:id/resume', authenticate, validate(updateResumeSchema), async (req, res) => {
  try {
    const employee = await EmployeeService.updateResume(req.params.id, req.validatedBody);
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/employees/:id/private-info
router.put('/:id/private-info', authenticate, validate(updatePrivateInfoSchema), async (req, res) => {
  try {
    const employee = await EmployeeService.updatePrivateInfo(req.params.id, req.validatedBody);
    res.json({ success: true, data: employee });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// GET /api/employees/:id/salary
router.get('/:id/salary', authenticate, rbac(['admin', 'payroll_officer']), async (req, res) => {
  try {
    const result = await EmployeeService.getSalary(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// PUT /api/employees/:id/salary
router.put('/:id/salary', authenticate, rbac(['admin', 'payroll_officer']), validate(salaryStructureSchema), async (req, res) => {
  try {
    const result = await EmployeeService.updateSalary(req.params.id, req.validatedBody);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/employees/:id/skills
router.post('/:id/skills', authenticate, validate(skillSchema), async (req, res) => {
  try {
    const skill = await EmployeeService.addSkill(req.params.id, req.validatedBody);
    res.status(201).json({ success: true, data: skill });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// DELETE /api/employees/:id/skills/:skillId
router.delete('/:id/skills/:skillId', authenticate, async (req, res) => {
  try {
    await EmployeeService.removeSkill(req.params.skillId, req.params.id);
    res.json({ success: true, message: 'Skill removed' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// POST /api/employees/:id/certifications
router.post('/:id/certifications', authenticate, validate(certificationSchema), async (req, res) => {
  try {
    const cert = await EmployeeService.addCertification(req.params.id, req.validatedBody);
    res.status(201).json({ success: true, data: cert });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

// DELETE /api/employees/:id/certifications/:certId
router.delete('/:id/certifications/:certId', authenticate, async (req, res) => {
  try {
    await EmployeeService.removeCertification(req.params.certId, req.params.id);
    res.json({ success: true, message: 'Certification removed' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
