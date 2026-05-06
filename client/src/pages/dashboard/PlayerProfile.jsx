import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../../components/SkeletonCard';

export default function PlayerProfile() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    api.get('/profile').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const { data: r } = await api.post('/profile/regenerate-text');
      setData(prev => ({ ...prev, current: { ...prev.current, profile_text: r.profile_text } }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error generating profile');
    } finally { setRegenerating(false); }
  };

  const dims = ['abertura', 'tatica', 'posicional', 'final', 'tempo', 'consistencia'];

  const radarData = dims.map(d => ({
    dim: t(`profile.dimensions.${d}`),
    current: data?.current?.[d] ?? 50,
    previous: data?.previous?.[d] ?? 50,
  }));

  const diff = (key) => {
    if (!data?.current || !data?.previous) return null;
    return data.current[key] - data.previous[key];
  };

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}><SkeletonCard height={360} /><SkeletonCard height={200} /></div>;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, marginBottom: 8, color: '#EFEFEF' }}>{t('profile.title')}</h1>
        {data?.current && (
          <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', marginBottom: 32 }}>
            {data.current.games_analyzed} games analyzed · ELO ~{data.current.estimated_elo}
          </p>
        )}
      </motion.div>

      {!data?.current?.games_analyzed ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>
          {t('profile.no_games')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Radar Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, marginBottom: 20, color: '#EFEFEF' }}>Skill Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1E1E32" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: '#7A7A9A', fontSize: 11, fontFamily: 'Inter' }} />
                <Radar name="Current" dataKey="current" stroke="#7C6AF7" fill="#7C6AF7" fillOpacity={0.2} strokeWidth={2} />
                {data?.previous && (
                  <Radar name="Last month" dataKey="previous" stroke="#00E5A0" fill="#00E5A0" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                )}
                <Tooltip contentStyle={{ background: '#10101E', border: '1px solid #1E1E32', borderRadius: 10, fontFamily: 'Inter', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
            {data?.previous && (
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>
                  <div style={{ width: 12, height: 2, background: '#7C6AF7', borderRadius: 1 }} /> Current
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>
                  <div style={{ width: 12, height: 2, background: '#00E5A0', borderRadius: 1, borderBottom: '1px dashed' }} /> Last month
                </div>
              </div>
            )}
          </motion.div>

          {/* Dimension bars */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, marginBottom: 20, color: '#EFEFEF' }}>Scores</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dims.map(d => {
                const val = data?.current?.[d] ?? 50;
                const delta = diff(d);
                return (
                  <div key={d}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#EFEFEF', fontFamily: 'Inter' }}>{t(`profile.dimensions.${d}`)}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 15, color: '#EFEFEF' }}>{val}</span>
                        {delta !== null && delta !== 0 && (
                          <span style={{ fontSize: 11, color: delta > 0 ? '#00E5A0' : '#FF4D4F', fontFamily: 'Inter' }}>
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ height: 6, background: '#1E1E32', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #7C6AF7, #00E5A0)', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Profile text */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="card" style={{ padding: 28, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, color: '#EFEFEF' }}>AI Player Analysis</h3>
              <button onClick={regenerate} disabled={regenerating} className="btn-secondary" style={{ fontSize: 13, padding: '8px 16px' }}>
                {regenerating ? 'Generating...' : t('profile.generate_text')}
              </button>
            </div>
            {data?.current?.profile_text ? (
              <p style={{ color: '#EFEFEF', fontSize: 14, lineHeight: 1.8, fontFamily: 'Inter', margin: 0, whiteSpace: 'pre-wrap' }}>
                {data.current.profile_text}
              </p>
            ) : (
              <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', fontStyle: 'italic' }}>
                Click "Regenerate" to generate your AI-powered player analysis.
              </p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
