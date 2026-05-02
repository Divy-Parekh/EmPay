const PDFDocument = require('pdfkit');

/**
 * Generate a payslip PDF as a buffer.
 * @param {Object} payslip - Payslip data
 * @param {Object} employee - Employee data
 * @param {string} payrunName - Name of the payrun
 */
function generatePayslipPDF(payslip, employee, payrunName) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // --- Header ---
      doc.fillColor('#444444').fontSize(20).text('EmPay HRMS', 50, 50);
      doc.fillColor('#7C3AED').fontSize(10).text('PAYSLIP', 200, 50, { align: 'right' });
      doc.moveDown();

      // --- Employee & Period Info ---
      doc.fillColor('#111111').fontSize(12).text(`Employee: ${employee.first_name} ${employee.last_name}`);
      doc.fontSize(10).text(`Job Position: ${employee.job_position || 'N/A'}`);
      doc.text(`Department: ${employee.department || 'N/A'}`);
      doc.moveDown();

      doc.fontSize(12).text(`Pay Period: ${payrunName}`);
      doc.fontSize(10).text(`Period: ${new Date(payslip.period_start).toLocaleDateString()} to ${new Date(payslip.period_end).toLocaleDateString()}`);
      doc.moveDown();

      // --- Table Headers ---
      const tableTop = 200;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Earnings', 50, tableTop);
      doc.text('Amount', 150, tableTop);
      doc.text('Deductions', 300, tableTop);
      doc.text('Amount', 450, tableTop);
      doc.moveDown();

      doc.font('Helvetica').fontSize(10);
      const rowHeight = 20;
      let currentY = tableTop + 20;

      // Rows
      const rows = [
        { earn: 'Basic', earnAmt: payslip.basic_amount, ded: 'PF (Employee)', dedAmt: payslip.pf_employee },
        { earn: 'HRA', earnAmt: payslip.hra_amount, ded: 'Professional Tax', dedAmt: payslip.professional_tax },
        { earn: 'Std Allowance', earnAmt: payslip.standard_allowance, ded: '', dedAmt: '' },
        { earn: 'Performance Bonus', earnAmt: payslip.performance_bonus, ded: '', dedAmt: '' },
        { earn: 'LTA', earnAmt: payslip.leave_travel, ded: '', dedAmt: '' },
        { earn: 'Fixed Allowance', earnAmt: payslip.fixed_allowance, ded: '', dedAmt: '' },
      ];

      rows.forEach(row => {
        doc.text(row.earn, 50, currentY);
        doc.text(row.earnAmt.toString(), 150, currentY);
        doc.text(row.ded, 300, currentY);
        doc.text(row.dedAmt.toString(), 450, currentY);
        currentY += rowHeight;
      });

      // --- Totals ---
      doc.moveDown();
      doc.font('Helvetica-Bold');
      doc.text(`Gross Earnings: ${payslip.gross_wage}`, 50, currentY + 20);
      doc.text(`Total Deductions: ${payslip.total_deductions}`, 300, currentY + 20);

      // --- Net Pay ---
      doc.fontSize(14).fillColor('#7C3AED').text(`Net Salary: ${payslip.net_wage}`, 50, currentY + 60, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePayslipPDF };
