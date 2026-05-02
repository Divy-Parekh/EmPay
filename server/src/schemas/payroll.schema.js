const { z } = require('zod');

const createPayrunSchema = z.object({
  name: z.string().min(1, 'Payrun name is required'),
  periodStart: z.string().min(1, 'Period start is required'),
  periodEnd: z.string().min(1, 'Period end is required'),
});

module.exports = { createPayrunSchema };
