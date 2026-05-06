const router = require('express').Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { checkAnalysisLimit, incrementAnalysis } = require('../middleware/planLimits');
const { analyzeGame, analyzeManyGames, generateTrainingPlan } = require('../services/claude');
const { query } = require('../db');

// Parse NDJSON from Lichess
function parseNdjson(text) {
  return text.trim().split('\n').filter(Boolean).map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}

// Fetch games from Lichess
async function fetchLichessGames(username, max = 20) {
  const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}`;
  const response = await axios.get(url, {
    params: { max, perfType: 'rapid,blitz,classical', pgnInJson: true, clocks: false, evals: false },
    headers: { Accept: 'application/x-ndjson' },
    timeout: 15000,
    responseType: 'text',
  });
  const games = parseNdjson(response.data);
  return games.map(g => g.pgn).filter(Boolean);
}

// Fetch games from Chess.com
async function fetchChessComGames(username, max = 20) {
  const now = new Date();
  const months = [
    { year: now.getFullYear(), month: String(now.getMonth() + 1).padStart(2, '0') },
    { year: now.getFullYear(), month: String(now.getMonth()).padStart(2, '0') || '12' },
  ];

  const pgns = [];
  for (const { year, month } of months) {
    if (pgns.length >= max) break;
    try {
      const url = `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${month}`;
      const { data } = await axios.get(url, { timeout: 10000 });
      const games = data.games || [];
      for (const g of games) {
        if (g.pgn && pgns.length < max) pgns.push(g.pgn);
      }
    } catch {}
  }
  return pgns;
}

// Preview games (no analysis — just counts)
router.get('/preview', authenticate, async (req, res, next) => {
  try {
    const { platform, username } = req.query;
    if (!platform || !username) return res.status(400).json({ error: 'platform and username required' });

    let pgns = [];
    try {
      if (platform === 'lichess') pgns = await fetchLichessGames(username, 20);
      else if (platform === 'chesscom') pgns = await fetchChessComGames(username, 20);
      else return res.status(400).json({ error: 'Invalid platform' });
    } catch (err) {
      if (err.response?.status === 404) return res.status(404).json({ error: `Usuário não encontrado no ${platform}` });
      return res.status(503).json({ error: `Não conseguimos conectar ao ${platform}. Tente colar o PGN manualmente.` });
    }

    if (!pgns.length) return res.status(404).json({ error: `Esse usuário não tem partidas recentes para analisar.` });

    res.json({ count: pgns.length, platform, username, pgns: pgns.slice(0, 20) });
  } catch (err) { next(err); }
});

// Batch import + analyze (onboarding)
router.post('/batch', authenticate, async (req, res, next) => {
  try {
    const { pgns, platform = 'manual', username } = req.body;
    if (!pgns?.length) return res.status(400).json({ error: 'No PGNs provided' });

    const toAnalyze = pgns.slice(0, 10);

    // Batch analysis with Claude
    const batchResult = await analyzeManyGames(toAnalyze, req.user.language);

    // Save all games individually (without per-game analysis to save tokens)
    const savedGames = [];
    for (const pgn of toAnalyze) {
      const { rows } = await query(
        'INSERT INTO games (user_id, pgn, platform) VALUES ($1, $2, $3) RETURNING id',
        [req.user.id, pgn, platform]
      );
      savedGames.push(rows[0]);
    }

    // Update player profile from batch analysis
    const p = batchResult.perfil;
    await query(`
      UPDATE player_profiles SET
        abertura = $1, tatica = $2, posicional = $3, final = $4,
        consistencia = $5, tempo = $6, estimated_elo = $7, games_analyzed = $8
      WHERE user_id = $9`,
      [p.abertura, p.tatica, p.posicional, p.final, p.consistencia, p.gestao_tempo,
       batchResult.estatisticas.elo_estimado, toAnalyze.length, req.user.id]
    );

    // Generate training plan from batch
    const plan = batchResult.plano_30_dias;
    await query('UPDATE training_plans SET is_active = FALSE WHERE user_id = $1', [req.user.id]);
    const semanasObj = {
      semana_1: plan.semana_1, semana_2: plan.semana_2,
      semana_3: plan.semana_3, semana_4: plan.semana_4,
      repertorio_recomendado: batchResult.repertorio_recomendado || null,
      partidas_gm_para_estudar: batchResult.partidas_gm_para_estudar || null,
    };
    await query(
      'INSERT INTO training_plans (user_id, focus, themes, exercises, description, semanas, metas, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)',
      [req.user.id,
       plan.semana_1?.tema || 'Plano inicial',
       JSON.stringify([plan.semana_1?.tema, plan.semana_2?.tema, plan.semana_3?.tema, plan.semana_4?.tema].filter(Boolean)),
       JSON.stringify(plan.semana_1?.sessoes?.[0]?.atividades || []),
       batchResult.diagnostico,
       JSON.stringify(semanasObj),
       JSON.stringify(batchResult.metas)]
    );

    // Save usernames if provided
    if (username && platform !== 'manual') {
      const col = platform === 'lichess' ? 'lichess_username' : 'chesscom_username';
      await query(`UPDATE users SET ${col} = $1, last_sync_at = NOW() WHERE id = $2`, [username, req.user.id]);
    }

    res.json({
      games_analyzed: toAnalyze.length,
      diagnostico: batchResult.diagnostico,
      perfil: batchResult.perfil,
      estatisticas: batchResult.estatisticas,
      metas: batchResult.metas,
      repertorio: batchResult.repertorio_recomendado,
    });
  } catch (err) { next(err); }
});

// Single game import from platform
router.post('/single', authenticate, checkAnalysisLimit, async (req, res, next) => {
  try {
    const { pgn, platform = 'manual', white, black, result } = req.body;
    if (!pgn) return res.status(400).json({ error: 'PGN required' });

    // Get player history for context
    const { rows: history } = await query(
      'SELECT analysis FROM games WHERE user_id = $1 AND analysis IS NOT NULL ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );

    const analysis = await analyzeGame(pgn, req.user.language, history.map(h => h.analysis));

    const { rows } = await query(
      'INSERT INTO games (user_id, pgn, white, black, result, analysis, platform) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.id, pgn, white || 'White', black || 'Black', result || '*', JSON.stringify(analysis), platform]
    );

    // Update player profile
    const p = analysis.perfil_update;
    if (p) {
      await query(`
        UPDATE player_profiles SET
          abertura   = ROUND((abertura   * games_analyzed + $1) / (games_analyzed + 1)),
          tatica     = ROUND((tatica     * games_analyzed + $2) / (games_analyzed + 1)),
          posicional = ROUND((posicional * games_analyzed + $3) / (games_analyzed + 1)),
          final      = ROUND((final      * games_analyzed + $4) / (games_analyzed + 1)),
          consistencia = ROUND((consistencia * games_analyzed + $5) / (games_analyzed + 1)),
          tempo      = ROUND((tempo * games_analyzed + $6) / (games_analyzed + 1)),
          estimated_elo = $7,
          games_analyzed = games_analyzed + 1
        WHERE user_id = $8`,
        [p.abertura ?? 50, p.tatica ?? 50, p.posicional ?? 50, p.final ?? 50,
         p.consistencia ?? 50, p.gestao_tempo ?? 50, p.elo_estimado ?? null, req.user.id]
      );
    }

    // Auto-generate training plan
    if (analysis.plano_treino_imediato) {
      const pt = analysis.plano_treino_imediato;
      const semanas = { semana_1: pt.semana_1, semana_2: pt.semana_2, semana_3: pt.semana_3, semana_4: pt.semana_4 };
      const temas = [pt.semana_1?.tema, pt.semana_2?.tema, pt.semana_3?.tema, pt.semana_4?.tema].filter(Boolean);
      const exercicios = pt.semana_1?.sessoes?.[0]?.atividades || [];
      await query('UPDATE training_plans SET is_active = FALSE WHERE user_id = $1', [req.user.id]);
      await query(
        'INSERT INTO training_plans (user_id, focus, themes, exercises, description, semanas, metas, pontos_fortes, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)',
        [req.user.id, pt.foco_principal, JSON.stringify(temas), JSON.stringify(exercicios),
         analysis.analise_geral, JSON.stringify(semanas),
         JSON.stringify(analysis.metas), JSON.stringify(analysis.pontos_fortes)]
      );
    }

    await incrementAnalysis(req.user.id);
    res.json({ game: rows[0], analysis });
  } catch (err) { next(err); }
});

// Sync new games since last sync
router.post('/sync', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT lichess_username, chesscom_username, last_sync_at FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    const pgns = [];

    if (user.lichess_username) {
      try { pgns.push(...await fetchLichessGames(user.lichess_username, 10)); } catch {}
    }
    if (user.chesscom_username) {
      try { pgns.push(...await fetchChessComGames(user.chesscom_username, 10)); } catch {}
    }

    await query('UPDATE users SET last_sync_at = NOW() WHERE id = $1', [req.user.id]);
    res.json({ new_games: pgns.length, pgns: pgns.slice(0, 20), last_sync: new Date() });
  } catch (err) { next(err); }
});

module.exports = router;
