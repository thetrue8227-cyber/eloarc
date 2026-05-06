import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import SkeletonCard from '../../components/SkeletonCard';
import { TrendingUp, Target, Flame, BarChart2, ArrowRight } from 'lucide-react';

const PLAN_LIMITS = { free: 3, rising: Infinity, elite: Infinity, arc_master: Infinity };

function AnimatedNumber({ value, duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  const isNum = typeof value === 'number' && !isNaN(value);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isNum) { setDisplay(value); return; }
    const start = Date.now();
    const from = 0;
    const to = value;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{isNum ? display : value}</>;
}

export default function Overview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/games?limit=3'),
      api.get('/profile'),
      api.get('/training'),
      api.get('/games/stats/usage'),
    ]).then(([g, p, tr, u]) => {
      setGames(g.data.games);
      setProfile(p.data.current);
      setPlan(tr.data.active);
      setUsage(u.data.usage);
    }).finally(() => setLoading(false));
  }, []);

  const mostFrequentError = () => {
    if (!games.length) return '—';
    const cats = {};
    games.forEach(g => g.analysis?.erros?.forEach(e => { cats[e.categoria] = (cats[e.categoria] || 0) + 1; }));
    const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    const labels = { opening: 'Abertura', tactics: 'Tática', positional: 'Posicional', endgame: 'Final' };
    return top ? (labels[top[0]] || top[0]) : '—';
  };

  const chartData = games.slice().reverse().map((g, i) => ({
    name: `G${i + 1}`,
    Tática: g.analysis?.perfil_update?.tatica || 50,
    Posicional: g.analysis?.perfil_update?.posicional || 50,
    Final: g.analysis?.perfil_update?.final || 50,
  }));

  const stats = [
    { label: t('overview.games_analyzed'), value: profile?.games_analyzed ?? 0, icon: BarChart2, color: '#7C6AF7' },
    { label: t('overview.top_error'), value: mostFrequentError(), icon: Target, color: '#FF6B6B', noAnim: true },
    { label: t('overview.estimated_elo'), value: profile?.estimated_elo ?? 0, icon: TrendingUp, color: '#00E5A0' },
    {
      label: user?.plan === 'free' ? 'Análises este mês' : 'Plano ativo',
      value: user?.plan === 'free' ? (usage?.analyses_count ?? 0) : user?.plan?.replace('_', ' ') || 'Free',
      icon: Flame, color: '#FFD700', noAnim: user?.plan !== 'free',
    },
  ];

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} height={120} />)}
    </div>
  );

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, marginBottom: 6, color: '#EFEFEF' }}>
          Hey, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', marginBottom: 32 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="card" style={{ padding: '20px 24px', boxShadow: `0 0 24px ${s.color}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <s.icon size={18} color={s.color} />
              <span style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 24, color: '#EFEFEF' }}>
              {s.noAnim ? s.value : <AnimatedNumber value={s.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: plan ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 28 }}>
        {/* Area chart */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="card" style={{ padding: 24 }}>
          <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, marginBottom: 20, color: '#EFEFEF' }}>Evolução por fase</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gTac" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C6AF7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C6AF7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gFin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#7A7A9A" tick={{ fontSize: 11, fill: '#7A7A9A' }} />
                <YAxis domain={[0, 100]} stroke="#7A7A9A" tick={{ fontSize: 11, fill: '#7A7A9A' }} />
                <Tooltip contentStyle={{ background: '#10101E', border: '1px solid #1E1E32', borderRadius: 10, fontFamily: 'Inter', fontSize: 12 }} />
                <Area type="monotone" dataKey="Tática" stroke="#7C6AF7" strokeWidth={2} fill="url(#gTac)" dot={false} />
                <Area type="monotone" dataKey="Posicional" stroke="#00E5A0" strokeWidth={2} fill="url(#gPos)" dot={false} />
                <Area type="monotone" dataKey="Final" stroke="#FFD700" strokeWidth={2} fill="url(#gFin)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ fontSize: 40 }}>📈</div>
              <div style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', textAlign: 'center' }}>
                Analise sua primeira partida para ver sua evolução
              </div>
              <button onClick={() => navigate('/dashboard/analyze')} className="btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>
                Analisar agora
              </button>
            </div>
          )}
        </motion.div>

        {/* Weekly focus */}
        {plan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="card" style={{ padding: 24, background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.2)' }}>
            <div style={{ fontSize: 11, color: '#7C6AF7', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Inter', marginBottom: 12 }}>
              {t('overview.weekly_focus')}
            </div>
            <h3 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 18, color: '#EFEFEF', marginBottom: 10 }}>{plan.focus}</h3>
            {plan.description && (
              <p style={{ color: '#7A7A9A', fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter', marginBottom: 20 }}>
                {plan.description.slice(0, 150)}{plan.description.length > 150 ? '...' : ''}
              </p>
            )}
            <button onClick={() => navigate('/dashboard/training')} className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
              Ver plano completo <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Recent games */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, color: '#EFEFEF' }}>{t('overview.recent_games')}</h3>
          <button onClick={() => navigate('/dashboard/history')} style={{ fontSize: 13, color: '#7C6AF7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>Ver todas →</button>
        </div>
        {games.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>♟</div>
            <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, color: '#EFEFEF', marginBottom: 6 }}>Nenhuma partida ainda</div>
            <p style={{ color: '#7A7A9A', fontSize: 13, fontFamily: 'Inter', marginBottom: 20 }}>Analise sua primeira partida para começar.</p>
            <button onClick={() => navigate('/dashboard/analyze')} className="btn-primary" style={{ fontSize: 14, padding: '10px 24px' }}>
              Analisar partida
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {games.map((g, i) => {
              const errCount = g.analysis?.erros?.length || 0;
              const elo = g.analysis?.perfil_update?.elo_estimado || g.analysis?.nivel_estimado;
              return (
                <motion.div key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                  className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#EFEFEF', marginBottom: 2 }}>{g.white} vs {g.black}</div>
                    <div style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>
                      {new Date(g.created_at).toLocaleDateString('pt-BR')}
                      {errCount > 0 && ` · ${errCount} erros`}
                      {elo && ` · ELO ${elo}`}
                    </div>
                  </div>
                  <button onClick={() => navigate('/dashboard/history')} style={{ fontSize: 12, color: '#7C6AF7', background: 'none', border: '1px solid rgba(124,106,247,0.3)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'Inter' }}>
                    {t('overview.see_details')}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
