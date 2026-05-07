const { query } = require('../db');

// Free, Pawn ($7), Knight ($19), King ($49)
const PLAN_LIMITS = {
  free:   { analyses: 3,        chat: 0,        maxElo: 1200 },
  pawn:   { analyses: Infinity, chat: 0,        maxElo: 2000 },
  knight: { analyses: Infinity, chat: 30,       maxElo: 2400 },
  king:   { analyses: Infinity, chat: Infinity, maxElo: 2800 },
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function getOrCreateUsage(userId) {
  const month = currentMonth();
  await query(
    `INSERT INTO monthly_usage (user_id, month) VALUES ($1, $2)
     ON CONFLICT (user_id, month) DO NOTHING`,
    [userId, month]
  );
  const { rows } = await query(
    'SELECT * FROM monthly_usage WHERE user_id = $1 AND month = $2',
    [userId, month]
  );
  return rows[0];
}

async function checkAnalysisLimit(req, res, next) {
  const { plan, id } = req.user;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  if (limits.analyses === Infinity) return next();

  const usage = await getOrCreateUsage(id);
  if (usage.analyses_count >= limits.analyses) {
    return res.status(403).json({
      error: 'monthly_limit_reached',
      plan,
      limit: limits.analyses,
      message: `Your ${plan} plan allows ${limits.analyses} analyses per month.`,
    });
  }
  req.usage = usage;
  next();
}

async function incrementAnalysis(userId) {
  const month = currentMonth();
  await query(
    `INSERT INTO monthly_usage (user_id, month, analyses_count)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, month)
     DO UPDATE SET analyses_count = monthly_usage.analyses_count + 1`,
    [userId, month]
  );
}

async function checkChatLimit(req, res, next) {
  const { plan, id } = req.user;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  if (limits.chat === 0) {
    return res.status(403).json({ error: 'plan_required', plan, message: 'Chat requires Knight plan or higher.' });
  }
  if (limits.chat === Infinity) return next();

  const usage = await getOrCreateUsage(id);
  if (usage.chat_messages_count >= limits.chat) {
    return res.status(403).json({
      error: 'chat_limit_reached',
      plan,
      limit: limits.chat,
      message: `Your ${plan} plan allows ${limits.chat} chat messages per month.`,
    });
  }
  req.usage = usage;
  next();
}

async function incrementChat(userId) {
  const month = currentMonth();
  await query(
    `INSERT INTO monthly_usage (user_id, month, chat_messages_count)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, month)
     DO UPDATE SET chat_messages_count = monthly_usage.chat_messages_count + 1`,
    [userId, month]
  );
}

function requirePlan(...plans) {
  return (req, res, next) => {
    if (!plans.includes(req.user.plan)) {
      return res.status(403).json({ error: 'plan_required', plan: req.user.plan, requires: plans, message: `This feature requires: ${plans.join(' or ')}` });
    }
    next();
  };
}

module.exports = { checkAnalysisLimit, incrementAnalysis, checkChatLimit, incrementChat, requirePlan, PLAN_LIMITS };
