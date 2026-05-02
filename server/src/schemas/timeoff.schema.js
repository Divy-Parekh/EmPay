const { z } = require('zod');

const createTimeOffRequestSchema = z.object({
  timeOffTypeId: z.string().uuid('Invalid time off type'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  allocationDays: z.number().min(0.5, 'Minimum 0.5 day'),
  note: z.string().optional(),
});

const allocateLeaveSchema = z.object({
  employeeId: z.string().uuid('Invalid employee'),
  timeOffTypeId: z.string().uuid('Invalid time off type'),
  days: z.number().min(0, 'Days must be non-negative'),
  year: z.number().int().min(2020).max(2100).optional(),
});

module.exports = { createTimeOffRequestSchema, allocateLeaveSchema };
