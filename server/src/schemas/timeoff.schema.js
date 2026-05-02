const { z } = require('zod');

const createTimeOffRequestSchema = z.object({
  time_off_type_id: z.string().uuid('Invalid time off type'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  allocation_days: z.coerce.number().min(0.5, 'Minimum 0.5 day'),
  note: z.string().optional(),
});

const allocateLeaveSchema = z.object({
  employee_id: z.string().uuid('Invalid employee'),
  time_off_type_id: z.string().uuid('Invalid time off type'),
  days: z.coerce.number().min(0, 'Days must be non-negative'),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

module.exports = { createTimeOffRequestSchema, allocateLeaveSchema };
