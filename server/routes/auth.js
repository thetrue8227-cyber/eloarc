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
    console.log('[auth] register attempt:', { email: email?.toLowerCase(), language });

    if (!name || !email || !password) {
      console.warn('[auth] register failed: missing fields');
      return res.status(400).json({ error: 'missing_fields' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'password_too_short' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length) {
      console.warn('[auth] register failed: email already exists', normalizedEmail);
      return res.status(409).json({ error: 'email_already_exists' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      'INSERT INTO users (name, email, password_hash, language) VALUES ($1, $2, $3, $4) RETURNING id, name, email, plan, language',
      [name.trim(), normalizedEmail, hash, language]
    );
    const user = rows[0];
    console.log('[auth] user registered:', user.id);

    await query('INSERT INTO player_profiles (user_id) VALUES ($1)', [user.id]);

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
      [user.id, refresh]
    );

    res.status(201).json({ user, access_token: access, refresh_token: refresh });
  } catch (err) {
    console.error('[auth] register error:', err);
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('[auth] login attempt:', email?.toLowerCase());

    if (!email || !password) {
      return res.status(400).json({ error: 'missing_credentials' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (!rows.length) {
      console.warn('[auth] login failed: email not found', normalizedEmail);
      return res.status(404).json({ error: 'email_not_found' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      console.warn('[auth] login failed: wrong password for', normalizedEmail);
      return res.status(401).json({ error: 'wrong_password' });
    }

    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'30 days\')',
      [user.id, refresh]
    );

    console.log('[auth] login success:', user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, access_token: access, refresh_token: refresh });
  } catch (err) {
    console.error('[auth] login error:', err);
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(401).json({ error: 'missing_refresh_token' });

    const payload = jwt.verify(refresh_token, process.env.JWT_SECRET);
    if (payload.type !== 'refresh') return res.status(401).json({ error: 'invalid_token_type' });

    const { rows } = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refresh_token]
    );
    if (!rows.length) return res.status(401).json({ error: 'refresh_expired' });

    const access = signAccess(payload.sub);
    res.json({ access_token: access });
  } catch (err) {
    return res.status(401).json({ error: 'invalid_refresh_token' });
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
    const { email, language } = req.body;
    if (!email) return res.status(400).json({ error: 'missing_email' });

    const normalizedEmail = email.toLowerCase().trim();
    const { rows } = await query(
      'SELECT id, name, language FROM users WHERE email = $1',
      [normalizedEmail]
    );
    console.log('[auth] forgot-password for', normalizedEmail, '— exists:', rows.length > 0);

    if (!rows.length) {
      // Tell the user explicitly (per spec) — no email enumeration concern in MVP
      return res.status(404).json({ error: 'email_not_found' });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    await query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
      [user.id, token]
    );

    const lang = language || user.language || 'pt-BR';
    await sendPasswordReset(normalizedEmail, token, lang);

    res.json({ message: 'reset_sent' });
  } catch (err) {
    console.error('[auth] forgot-password error:', err);
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ error: 'missing_token' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'password_too_short' });

    const { rows } = await query(
      'SELECT * FROM password_resets WHERE token = $1 AND used = FALSE',
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'token_invalid' });

    const reset = rows[0];
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'token_expired' });
    }

    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, reset.user_id]);
    await query('UPDATE password_resets SET used = TRUE WHERE id = $1', [reset.id]);
    // Invalidate all existing sessions for this user when password changes
    await query('DELETE FROM refresh_tokens WHERE user_id = $1', [reset.user_id]);

    console.log('[auth] password reset success for user', reset.user_id);
    res.json({ message: 'password_updated' });
  } catch (err) {
    console.error('[auth] reset-password error:', err);
    next(err);
  }
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
