const { z } = require('zod');

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  jobPosition: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().uuid().optional().nullable(),
  location: z.string().optional(),
  dateOfJoining: z.string().optional(),
});

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  jobPosition: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().uuid().optional().nullable(),
  location: z.string().optional(),
});

const updateResumeSchema = z.object({
  about: z.string().optional().nullable(),
  jobLove: z.string().optional().nullable(),
  interests: z.string().optional().nullable(),
});

const updatePrivateInfoSchema = z.object({
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  bankAccNumber: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  uanNumber: z.string().optional().nullable(),
  empCode: z.string().optional().nullable(),
});

const salaryStructureSchema = z.object({
  monthlyWage: z.number().min(0),
  workingDays: z.number().int().min(1).max(31).optional(),
  breakTimeHrs: z.number().min(0).optional(),
  basicPct: z.number().min(0).max(100).optional(),
  hraPct: z.number().min(0).max(100).optional(),
  standardAllowance: z.number().min(0).optional(),
  performanceBonusPct: z.number().min(0).max(100).optional(),
  leaveTravelPct: z.number().min(0).max(100).optional(),
  pfRate: z.number().min(0).max(100).optional(),
  professionalTax: z.number().min(0).optional(),
});

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.string().optional(),
});

const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().optional(),
  dateObtained: z.string().optional(),
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
