const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requirePlan } = require('../middleware/planLimits');
const { generateMonthlyReportText } = require('../services/claude');
const { generatePDF } = require('../services/pdf');
const { sendPDFReport } = require('../services/email');
const { query } = require('../db');

router.post('/monthly-report', authenticate, requirePlan('king'), async (req, res, next) => {
  try {
    const { rows: games } = await query(
      'SELECT pgn, analysis, white, black, result, created_at FROM games WHERE user_id = $1 AND analysis IS NOT NULL ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );
    if (games.length < 1) return res.status(400).json({ error: 'No analyzed games found' });

    const { rows: profiles } = await query(
      'SELECT * FROM player_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    const reportContent = await generateMonthlyReportText(games, profiles[0] || {}, req.user.language);
    const pdfBuffer = await generatePDF(reportContent, req.user.name);

    // Send by email
    await sendPDFReport(req.user.email, req.user.name, pdfBuffer, req.user.language);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="elo-arc-report-${new Date().toISOString().slice(0, 7)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

module.exports = router;
