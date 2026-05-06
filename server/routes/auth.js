const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { sendPasswordReset } = require('../services/email');

function signAccess(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function signRefresh(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, language = 'pt-BR' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      'INSERT INTO users (name, email, password_hash, language) VALUES ($1, $2, $3, $4) RETURNING id, name, email, plan, language',
      [name, email.toLowerCase(), hash, language]
    );
    const user = rows[0];

    // Create initial player profile
    await query('INSERT INTO player_profiles (user_id) VALUES ($1)', [user.id]);

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
      [user.id, refresh]
    );

    res.status(201).json({ user, access_token: access, refresh_token: refresh });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
      [user.id, refresh]
    );

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, access_token: access, refresh_token: refresh });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(401).json({ error: 'Missing refresh token' });

    const payload = jwt.verify(refresh_token, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type' });

    const { rows } = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refresh_token]
    );
    if (!rows.length) return res.status(401).json({ error: 'Refresh token expired or invalid' });

    const access = signAccess(payload.sub);
    res.json({ access_token: access });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
    }
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email?.toLowerCase()]);
    // Always return success to avoid email enumeration
    if (!rows.length) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    await query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
      [rows[0].id, token]
    );
    await sendPasswordReset(email, token);
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) { next(err); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) return res.status(400).json({ error: 'Invalid request' });

    const { rows } = await query(
      'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW() AND used = FALSE',
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Token invalid or expired' });

    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, rows[0].user_id]);
    await query('UPDATE password_resets SET used = TRUE WHERE id = $1', [rows[0].id]);

    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, plan, language, photo_url, lichess_username, chesscom_username, last_sync_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name, language, photo_url, lichess_username, chesscom_username } = req.body;
    const { rows } = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        language = COALESCE($2, language),
        photo_url = COALESCE($3, photo_url),
        lichess_username = COALESCE($4, lichess_username),
        chesscom_username = COALESCE($5, chesscom_username),
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, name, email, plan, language, photo_url, lichess_username, chesscom_username, last_sync_at`,
      [name, language, photo_url, lichess_username || null, chesscom_username || null, req.user.id]
    );
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
