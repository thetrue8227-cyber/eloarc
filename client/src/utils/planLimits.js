// Free, Pawn ($7), Knight ($19), King ($49)
export const PLAN_LIMITS = {
  free:   { analyses: 3,        chat: 0,        maxElo: 1200 },
  pawn:   { analyses: Infinity, chat: 0,        maxElo: 2000 },
  knight: { analyses: Infinity, chat: 30,       maxElo: 2400 },
  king:   { analyses: Infinity, chat: Infinity, maxElo: 2800 },
};

export const PLAN_LABELS = { free: 'Free', pawn: 'Pawn', knight: 'Knight', king: 'King' };
export const PLAN_LABELS_FULL = {
  free: 'Free',
  pawn: 'Pawn — $7/mo',
  knight: 'Knight — $19/mo',
  king: 'King — $49/mo',
};
export const PLAN_COLORS = {
  free: '#7A7A9A',
  pawn: '#7C6AF7',
  knight: '#00E5A0',
  king: '#FFD700',
};
export const PLAN_BG = {
  free: 'rgba(122,122,154,0.12)',
  pawn: 'rgba(124,106,247,0.12)',
  knight: 'rgba(0,229,160,0.12)',
  king: 'rgba(255,215,0,0.12)',
};
