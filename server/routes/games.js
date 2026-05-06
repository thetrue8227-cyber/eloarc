const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkAnalysisLimit, incrementAnalysis } = require('../middleware/planLimits');
const { analyzeGame } = require('../services/claude');
const { query } = require('../db');

// Upload & analyze PGN
router.post('/analyze', authenticate, checkAnalysisLimit, async (req, res, next) => {
  try {
    const { pgn, white, black, result } = req.body;
    if (!pgn || pgn.trim().length < 20) return res.status(400).json({ error: 'Invalid PGN' });

    const analysis = await analyzeGame(pgn, req.user.language);

    const { rows } = await query(
      'INSERT INTO games (user_id, pgn, white, black, result, analysis) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, pgn, white || 'White', black || 'Black', result || '*', JSON.stringify(analysis)]
    );
    const game = rows[0];

    // Update player profile scores
    if (analysis.perfil_update) {
      const p = analysis.perfil_update;
      await query(`
        UPDATE player_profiles SET
          abertura   = ROUND((abertura   * games_analyzed + $1) / (games_analyzed + 1)),
          tatica     = ROUND((tatica     * games_analyzed + $2) / (games_analyzed + 1)),
          posicional = ROUND((posicional * games_analyzed + $3) / (games_analyzed + 1)),
          final      = ROUND((final      * games_analyzed + $4) / (games_analyzed + 1)),
          consistencia = ROUND((consistencia * games_analyzed + $5) / (games_analyzed + 1)),
          estimated_elo = $6,
          games_analyzed = games_analyzed + 1
        WHERE user_id = $7`,
        [p.abertura ?? 50, p.tatica ?? 50, p.posicional ?? 50, p.final ?? 50,
         p.consistencia ?? 50, parseInt(analysis.nivel_estimado) || null, req.user.id]
      );
    }

    await incrementAnalysis(req.user.id);

    // Auto-update training plan if analysis has one
    if (analysis.plano_treino) {
      const pt = analysis.plano_treino;
      await query('UPDATE training_plans SET is_active = FALSE WHERE user_id = $1', [req.user.id]);
      await query(
        'INSERT INTO training_plans (user_id, focus, themes, exercises, description) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, pt.foco_semanal, JSON.stringify(pt.temas), JSON.stringify(pt.exercicios), pt.foco_semanal]
      );
    }

    res.json({ game, analysis });
  } catch (err) { next(err); }
});

// Get game history
router.get('/', authenticate, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;
    const { rows } = await query(
      'SELECT id, white, black, result, analysis, created_at FROM games WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json({ games: rows });
  } catch (err) { next(err); }
});

// Get single game
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM games WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Game not found' });
    res.json({ game: rows[0] });
  } catch (err) { next(err); }
});

// Delete game
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM games WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Game not found' });
    res.json({ message: 'Game deleted' });
  } catch (err) { next(err); }
});

// Get monthly usage stats
router.get('/stats/usage', authenticate, async (req, res, next) => {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const { rows } = await query(
      'SELECT * FROM monthly_usage WHERE user_id = $1 AND month = $2',
      [req.user.id, month]
    );
    res.json({ usage: rows[0] || { analyses_count: 0, chat_messages_count: 0 } });
  } catch (err) { next(err); }
});

module.exports = router;
