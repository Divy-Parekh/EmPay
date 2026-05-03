const { query } = require('./db');
const PayrollService = require('../services/payroll.service');

async function populate() {
    const companyRes = await query('SELECT id FROM companies LIMIT 1');
    const companyId = companyRes.rows[0].id;
    const adminRes = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const adminId = adminRes.rows[0].id;

    const months = [
        { m: 1, y: 2024 }, { m: 2, y: 2024 }, { m: 3, y: 2024 },
        { m: 4, y: 2024 }, { m: 5, y: 2024 }
    ];

    for (const { m, y } of months) {
        const period_start = new Date(y, m - 1, 1).toISOString().split('T')[0];
        const period_end = new Date(y, m, 0).toISOString().split('T')[0];
        const name = `Historical Payrun ${new Date(y, m - 1).toLocaleString('en', { month: 'short' })} ${y}`;

        console.log(`⏳ Generating ${name}...`);
        try {
            const payrun = await PayrollService.createPayrun(companyId, adminId, { name, period_start, period_end });
            const stats = await PayrollService.computePayrun(payrun.id);
            await PayrollService.validatePayrun(payrun.id);
            console.log(`✅ Generated ${stats.computed} payslips for ${name}`);
        } catch (err) {
            console.log(`❌ Skipped ${name}: ${err.message}`);
        }
    }
    process.exit();
}

populate();
