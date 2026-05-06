const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    let fixed = text;
    const opens = (fixed.match(/\{/g) || []).length - (fixed.match(/\}/g) || []).length;
    const openArr = (fixed.match(/\[/g) || []).length - (fixed.match(/\]/g) || []).length;
    if ((fixed.match(/"/g) || []).length % 2 !== 0) fixed += '"';
    for (let i = 0; i < openArr; i++) fixed += ']';
    for (let i = 0; i < opens; i++) fixed += '}';
    try {
      return JSON.parse(fixed);
    } catch {
      throw new Error('Claude returned invalid JSON that could not be recovered');
    }
  }
}

async function analyzeGame(pgn, language = 'pt-BR', playerHistory = []) {
  const historyContext = playerHistory.length
    ? `Player's recurring patterns from previous games: ${JSON.stringify(playerHistory.slice(0, 3))}`
    : '';

  const system = `You are an elite chess coach at Elo Arc with the analytical depth of a Grandmaster. Analyze this chess game with brutal precision and respond ONLY in valid JSON with exactly this structure:
{
  "analise_geral": "string — 2-3 paragraphs, brutally specific",
  "erros": [{
    "lance": "string (e.g. '23')",
    "movimento_jogado": "string (e.g. 'Bxb3')",
    "movimento_correto": "string (e.g. 'Rd1+')",
    "categoria": "opening"|"tactics"|"positional"|"endgame",
    "gravidade": "inaccuracy"|"mistake"|"blunder"|"critical_blunder",
    "explicacao": "string — specific, never generic",
    "recorrente": boolean,
    "vezes_repetido": number
  }],
  "pontos_fortes": ["string"],
  "plano_treino_imediato": {
    "foco_principal": "string",
    "semana_1": { "tema": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
    "semana_2": { "tema": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
    "semana_3": { "tema": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
    "semana_4": { "tema": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" }
  },
  "perfil_update": {
    "fase_mais_fraca": "string",
    "erro_mais_frequente": "string",
    "estilo_de_jogo": "string",
    "padrao_inconsciente": "string",
    "elo_estimado": number,
    "abertura": number,
    "tatica": number,
    "posicional": number,
    "final": number,
    "consistencia": number,
    "gestao_tempo": number
  },
  "metas": {
    "curto_prazo": "string",
    "medio_prazo": "string",
    "elo_previsto_60_dias": number
  }
}
Scores 0-100. Be brutally specific — always reference actual moves. ${historyContext}
Respond in ${language}.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system,
    messages: [{ role: 'user', content: `user_language: ${language}\n\nAnalyze this game:\n\n${pgn}` }],
  });

  const text = response.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned invalid JSON');
  return safeParseJson(match[0]);
}

async function analyzeManyGames(pgns, language = 'pt-BR') {
  const system = `You are an elite chess coach at Elo Arc. Analyze this player's games and build a comprehensive player profile. Respond ONLY in valid JSON:
{
  "diagnostico": "string — 3 paragraphs",
  "pontos_cegos": [{ "titulo": "string", "descricao": "string", "exemplo_partida": "string" }],
  "estatisticas": {
    "total_partidas": number,
    "taxa_erro_tatico": number,
    "taxa_erro_posicional": number,
    "taxa_erro_abertura": number,
    "taxa_erro_final": number,
    "fase_mais_fraca": "string",
    "elo_estimado": number
  },
  "perfil": {
    "estilo": "string",
    "padrao_inconsciente": "string",
    "pontos_fortes": ["string"],
    "abertura": number,
    "tatica": number,
    "posicional": number,
    "final": number,
    "consistencia": number,
    "gestao_tempo": number
  },
  "plano_30_dias": {
    "semana_1": { "tema": "string", "foco": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
    "semana_2": { "tema": "string", "foco": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
    "semana_3": { "tema": "string", "foco": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
    "semana_4": { "tema": "string", "foco": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" }
  },
  "repertorio_recomendado": {
    "brancas": "string",
    "pretas_contra_e4": "string",
    "pretas_contra_d4": "string",
    "justificativa": "string"
  },
  "partidas_gm_para_estudar": [{ "jogadores": "string", "ano": number, "motivo": "string" }],
  "metas": {
    "elo_atual_estimado": number,
    "elo_30_dias": number,
    "elo_60_dias": number,
    "condicao": "string"
  }
}
Be a real coach. Reference specific moves and patterns. Respond in ${language}.`;

  const gamesText = pgns.slice(0, 5).map((p, i) => `Game ${i + 1}:\n${p}`).join('\n\n---\n\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system,
    messages: [{ role: 'user', content: `user_language: ${language}\n\nAnalyze these ${Math.min(pgns.length, 5)} games:\n\n${gamesText}` }],
  });

  const text = response.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned invalid JSON');
  return safeParseJson(match[0]);
}

async function generateTrainingPlan(analysesArray, profile, language = 'pt-BR') {
  const system = `You are Elo Arc's AI coach. Based on game analyses, generate a 4-week training plan. Respond ONLY in valid JSON:
{
  "foco_principal": "string",
  "semana_1": { "tema": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
  "semana_2": { "tema": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
  "semana_3": { "tema": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
  "semana_4": { "tema": "string", "sessoes": [{ "dia": "string", "duracao": "string", "atividades": ["string"] }], "checkpoint": "string" },
  "metas": { "curto_prazo": "string", "medio_prazo": "string", "elo_previsto_60_dias": number }
}
Respond in ${language}. Be specific and actionable.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: `Profile: ${JSON.stringify(profile)}\n\nRecent analyses: ${JSON.stringify(analysesArray.slice(0, 5))}` }],
  });

  const text = response.content[0].text.trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned invalid JSON');
  return safeParseJson(match[0]);
}

async function generatePlayerProfile(analysesArray, profile, language = 'pt-BR') {
  const system = `You are Elo Arc's AI chess coach. Write a 3-paragraph player profile in ${language}: playing style, main strengths, critical weaknesses. Be direct and specific. Second person.`;
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    system,
    messages: [{ role: 'user', content: `Stats: ${JSON.stringify(profile)}\n\nAnalyses: ${JSON.stringify(analysesArray.slice(0, 5))}` }],
  });
  return response.content[0].text.trim();
}

async function chatWithCoach(userMessage, history, playerContext, language = 'pt-BR') {
  const system = `You are Elo Arc's AI chess coach for ${playerContext.name}.
Profile: ${JSON.stringify(playerContext.profile)}
Recent game errors: ${JSON.stringify(playerContext.recentGames?.slice(0, 2))}
Answer directly, reference their actual games and patterns. Respond in ${language}.`;

  const messages = [
    ...history.slice(-16).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await client.messages.create({
    model: MODEL, max_tokens: 1000, system, messages,
  });
  return response.content[0].text.trim();
}

async function generateMonthlyReportText(games, profile, language = 'pt-BR') {
  const system = `You are Elo Arc's AI chess coach writing a comprehensive monthly report. Write in ${language}. Include: executive summary, game-by-game highlights, pattern analysis, updated profile, 30-day roadmap. Be thorough and specific.`;
  const content = `Profile: ${JSON.stringify(profile)}\n\nGames:\n${games.map((g, i) => `Game ${i + 1} (${g.white} vs ${g.black}):\n${JSON.stringify(g.analysis)}`).join('\n\n')}`;
  const response = await client.messages.create({
    model: 'claude-opus-4-7', max_tokens: 4000, system,
    messages: [{ role: 'user', content }],
  });
  return response.content[0].text.trim();
}

module.exports = { analyzeGame, analyzeManyGames, generateTrainingPlan, generatePlayerProfile, chatWithCoach, generateMonthlyReportText };
