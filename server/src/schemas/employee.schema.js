const { z } = require('zod');

const createEmployeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  job_position: z.string().optional(),
  department: z.string().optional(),
  manager_id: z.string().uuid().optional().nullable(),
  location: z.string().optional(),
  date_of_joining: z.string().optional(),
});

const updateEmployeeSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  job_position: z.string().optional(),
  department: z.string().optional(),
  manager_id: z.string().uuid().optional().nullable(),
  location: z.string().optional(),
});

const updateResumeSchema = z.object({
  about: z.string().optional().nullable(),
  job_love: z.string().optional().nullable(),
  interests: z.string().optional().nullable(),
});

const updatePrivateInfoSchema = z.object({
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  marital_status: z.string().optional().nullable(),
  bank_acc_number: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  ifsc_code: z.string().optional().nullable(),
  pan_number: z.string().optional().nullable(),
  uan_number: z.string().optional().nullable(),
  emp_code: z.string().optional().nullable(),
});

const salaryStructureSchema = z.object({
  monthly_wage: z.coerce.number().min(0),
  working_days: z.coerce.number().int().min(1).max(31).optional(),
  break_time_hrs: z.coerce.number().min(0).optional(),
  basic_pct: z.coerce.number().min(0).max(100).optional(),
  hra_pct: z.coerce.number().min(0).max(100).optional(),
  standard_allowance: z.coerce.number().min(0).optional(),
  performance_bonus_pct: z.coerce.number().min(0).max(100).optional(),
  leave_travel_pct: z.coerce.number().min(0).max(100).optional(),
  pf_rate: z.coerce.number().min(0).max(100).optional(),
  professional_tax: z.coerce.number().min(0).optional(),
});

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.string().optional(),
});

const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().optional(),
  date_obtained: z.string().optional(),
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateResumeSchema,
  updatePrivateInfoSchema,
  salaryStructureSchema,
  skillSchema,
  certificationSchema,
};
