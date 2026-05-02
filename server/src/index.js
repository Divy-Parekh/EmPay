const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const env = require('./config/env');

const app = express();

// ─── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: env.clientUrl,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/employees', require('./routes/employee.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/time-off', require('./routes/timeoff.routes'));
app.use('/api/payroll', require('./routes/payroll.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// ─── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
});

// ─── Global Error Handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

// ─── Start Server ───────────────────────────────────────
const PORT = env.port;
app.listen(PORT, () => {
  console.log(`\n🚀 EmPay server running on http://localhost:${PORT}`);
  console.log(`📋 API base: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
