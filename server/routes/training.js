const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { generateTrainingPlan } = require('../services/claude');
const { query } = require('../db');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM training_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.user.id]
    );
    const active = rows.find(p => p.is_active) || null;
    if (active) {
      // Expose nested fields to frontend
      active.repertorio_recomendado = active.semanas?.repertorio_recomendado || null;
      active.gm_games = active.semanas?.partidas_gm_para_estudar || null;
    }
    res.json({ plans: rows, active });
  } catch (err) { next(err); }
});

router.post('/regenerate', authenticate, async (req, res, next) => {
  try {
    const { rows: games } = await query(
      'SELECT analysis FROM games WHERE user_id = $1 AND analysis IS NOT NULL ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );

    const { rows: profiles } = await query(
      'SELECT * FROM player_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    const profile = profiles[0] || {};
    const plan = await generateTrainingPlan(games.map(g => g.analysis), profile, req.user.language);

    await query('UPDATE training_plans SET is_active = FALSE WHERE user_id = $1', [req.user.id]);

    const semanas = {
      semana_1: plan.semana_1, semana_2: plan.semana_2,
      semana_3: plan.semana_3, semana_4: plan.semana_4,
    };
    const temas = [plan.semana_1?.tema, plan.semana_2?.tema, plan.semana_3?.tema, plan.semana_4?.tema].filter(Boolean);
    const exercicios = plan.semana_1?.sessoes?.[0]?.atividades || [];
    const metas = plan.metas || null;

    const { rows } = await query(
      'INSERT INTO training_plans (user_id, focus, themes, exercises, description, semanas, metas, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE) RETURNING *',
      [req.user.id, plan.foco_principal || plan.foco_semanal || 'Treino personalizado',
       JSON.stringify(temas), JSON.stringify(exercicios),
       plan.foco_principal || plan.foco_semanal || '',
       JSON.stringify(semanas), JSON.stringify(metas)]
    );

    res.json({ plan: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
