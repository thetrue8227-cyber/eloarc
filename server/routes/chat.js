const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { checkChatLimit, incrementChat } = require('../middleware/planLimits');
const { chatWithCoach } = require('../services/claude');
const { query } = require('../db');

router.get('/messages', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, role, content, created_at FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100',
      [req.user.id]
    );
    res.json({ messages: rows });
  } catch (err) { next(err); }
});

router.post('/send', authenticate, checkChatLimit, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) return res.status(400).json({ error: 'Empty message' });

    // Save user message
    await query(
      'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3)',
      [req.user.id, 'user', message]
    );

    // Get player context
    const { rows: profiles } = await query(
      'SELECT * FROM player_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    const { rows: recentGames } = await query(
      'SELECT analysis FROM games WHERE user_id = $1 AND analysis IS NOT NULL ORDER BY created_at DESC LIMIT 3',
      [req.user.id]
    );

    // Get recent chat history for context
    const { rows: history } = await query(
      'SELECT role, content FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );

    const playerContext = {
      profile: profiles[0] || {},
      recentGames: recentGames.map(g => g.analysis),
      name: req.user.name,
    };

    const reply = await chatWithCoach(
      message,
      history.reverse(),
      playerContext,
      req.user.language
    );

    // Save assistant message
    const { rows } = await query(
      'INSERT INTO chat_messages (user_id, role, content) VALUES ($1, $2, $3) RETURNING id, role, content, created_at',
      [req.user.id, 'assistant', reply]
    );

    await incrementChat(req.user.id);

    res.json({ message: rows[0] });
  } catch (err) { next(err); }
});

router.delete('/messages', authenticate, async (req, res, next) => {
  try {
    await query('DELETE FROM chat_messages WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Chat cleared' });
  } catch (err) { next(err); }
});

module.exports = router;
