require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, initDB } = require('./db');

const DEMO_PGN = `1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 d6 8.c3 O-O 9.h3 Na5 10.Bc2 c5 11.d4 Qc7 12.Nbd2 cxd4 13.cxd4 Nc6 14.Nb3 a5 15.Be3 a4 16.Nbd2 Bd7 17.Rc1 Qb7 18.Bb1 Nd8 19.Nf1 Ne6 20.Ne3 exd4 21.Nxd4 Nxd4 22.Bxd4 Be6 23.Qd3 Rfc8 24.Rcd1 Nd7 25.Nf5 Bxf5 26.exf5 Bf6 27.Bxf6 Nxf6 28.Re3 Rc5 29.b4 axb3 30.axb3 Rcc8 31.b4 Qd7 32.Qd4 Rc4 33.Qd3 Rac8 34.Rde1 Qb7 0-1`;

async function seed() {
  await initDB();

  const hash = await bcrypt.hash('demo1234', 12);
  const { rows: [user] } = await pool.query(
    `INSERT INTO users (name, email, password_hash, plan, language)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET plan = EXCLUDED.plan
     RETURNING id`,
    ['Demo Player', 'demo@eloarc.com', hash, 'knight', 'en']
  );

  const userId = user.id;

  // Upsert player profile
  await pool.query(
    `INSERT INTO player_profiles (user_id, abertura, tatica, posicional, final, tempo, consistencia, games_analyzed, estimated_elo, profile_text)
     VALUES ($1, 62, 55, 48, 40, 58, 52, 3, 1350, 'You are an attacking player who excels in open games and sharp tactical positions. Your opening preparation is solid, particularly in the Ruy Lopez, but you tend to lose threads in closed middlegame positions. Your main weakness is endgame technique, especially when converting winning positions with opposite-colored bishops.')
     ON CONFLICT DO NOTHING`,
    [userId]
  );

  // Insert sample games
  await pool.query(
    `INSERT INTO games (user_id, pgn, white, black, result, analysis) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING`,
    [userId, DEMO_PGN, 'Demo Player', 'Bot_1350', '0-1', JSON.stringify({
      erros: [
        { lance: '24', categoria: 'positional', descricao: 'Knight to d7 allows White to activate with Nf5, trading a key defensive piece. Qd7 was better to keep the knight flexible.', gravidade: 'medium' },
        { lance: '32', categoria: 'tactics', descricao: 'After Qd4 you missed the tactic Rxc2! winning a pawn and disrupting White\'s coordination.', gravidade: 'high' },
        { lance: '34', categoria: 'endgame', descricao: 'Rac8 is too passive. Rc2 was necessary to create counterplay on the second rank.', gravidade: 'medium' },
      ],
      plano_treino: { temas: ['Rook endgames', 'Passed pawn technique'], exercicios: ['Solve 20 Lichess rook endgame puzzles', 'Analyze Capablanca\'s endgames'], foco_semanal: 'Endgame technique' },
      resumo_geral: 'A well-played opening phase but the middlegame transition revealed positional weaknesses. The endgame was the critical failure point where you missed concrete defensive resources.',
      nivel_estimado: '1350',
      perfil_update: { abertura: 65, tatica: 52, posicional: 46, final: 38, consistencia: 50 },
    })]
  );

  // Insert training plan
  await pool.query(
    `INSERT INTO training_plans (user_id, focus, themes, exercises, description, is_active) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING`,
    [userId, 'Endgame Technique', JSON.stringify(['Rook vs Rook endgames', 'King activity in endgames', 'Pawn structure fundamentals']),
     JSON.stringify(['Complete 20 Lichess endgame puzzles daily', 'Study Capablanca vs Nimzowitsch, Riga 1913', 'Practice king and pawn endgames vs engine at ELO 800']),
     'Your recent games show consistent endgame struggles, especially in rook endgames. This week focus on converting winning positions and defensive technique.',
     true]
  );

  // Personal accounts — King plan (unlimited access)
  const personalHash = await bcrypt.hash('EloArc2026!', 12);
  const personalAccounts = [
    { email: 'pinksbx@gmail.com',     name: 'Pedro',     language: 'pt-BR' },
    { email: 'thetrue8227@gmail.com', name: 'Pedro',     language: 'pt-BR' },
  ];

  for (const acc of personalAccounts) {
    const { rows: [u] } = await pool.query(
      `INSERT INTO users (name, email, password_hash, plan, language)
       VALUES ($1, $2, $3, 'king', $4)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         plan = 'king',
         updated_at = NOW()
       RETURNING id`,
      [acc.name, acc.email, personalHash, acc.language]
    );
    await pool.query(
      `INSERT INTO player_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [u.id]
    );
    console.log(`Personal account ready: ${acc.email} / EloArc2026! (plan: king)`);
  }

  console.log('Seed complete! Demo account: demo@eloarc.com / demo1234');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
