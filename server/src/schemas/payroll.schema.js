const { z } = require('zod');

const createPayrunSchema = z.object({
  name: z.string().min(1, 'Payrun name is required'),
  period_start: z.string().min(1, 'Period start is required'),
  period_end: z.string().min(1, 'Period end is required'),
});

module.exports = { createPayrunSchema };
