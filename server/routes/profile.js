const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { generatePlayerProfile } = require('../services/claude');
const { query } = require('../db');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM player_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );
    const current = rows[0] || null;
    const previous = rows[1] || null;
    res.json({ current, previous, history: rows });
  } catch (err) { next(err); }
});

router.post('/regenerate-text', authenticate, async (req, res, next) => {
  try {
    const { rows: games } = await query(
      'SELECT analysis FROM games WHERE user_id = $1 AND analysis IS NOT NULL ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );
    const { rows: profiles } = await query(
      'SELECT * FROM player_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (!games.length) return res.status(400).json({ error: 'No games analyzed yet' });

    const profile = profiles[0] || {};
    const profileText = await generatePlayerProfile(games.map(g => g.analysis), profile, req.user.language);

    await query(
      'UPDATE player_profiles SET profile_text = $1 WHERE user_id = $2',
      [profileText, req.user.id]
    );

    res.json({ profile_text: profileText });
  } catch (err) { next(err); }
});

module.exports = router;
