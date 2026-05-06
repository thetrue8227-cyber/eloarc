export const PLAN_LIMITS = {
  free:       { analyses: 3,        chat: 0,   maxElo: 1200 },
  rising:     { analyses: Infinity, chat: 20,  maxElo: 2200 },
  elite:      { analyses: Infinity, chat: Infinity, maxElo: 2800 },
  arc_master: { analyses: Infinity, chat: Infinity, maxElo: 3000 },
};
