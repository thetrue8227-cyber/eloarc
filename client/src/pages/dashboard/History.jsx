import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../../components/SkeletonCard';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const SEV_COLOR = { low: '#00E5A0', medium: '#FFD500', high: '#FF4D4F' };
const CAT_COLOR = { opening: '#7C6AF7', tactics: '#FF6B6B', positional: '#FFD700', endgame: '#00E5A0' };

export default function History() {
  const { t } = useTranslation();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/games?limit=50').then(r => setGames(r.data.games)).finally(() => setLoading(false));
  }, []);

  const deleteGame = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this game?')) return;
    try {
      await api.delete(`/games/${id}`);
      setGames(prev => prev.filter(g => g.id !== id));
      if (expanded === id) setExpanded(null);
      toast.success('Game deleted');
    } catch { toast.error(t('errors.generic')); }
  };

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[...Array(5)].map((_, i) => <SkeletonCard key={i} height={72} />)}</div>;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, marginBottom: 8, color: '#EFEFEF' }}>{t('history.title')}</h1>
        <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>{games.length} games analyzed</p>
      </motion.div>

      {games.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>
          {t('history.no_games')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {games.map((g, i) => (
            <motion.div key={g.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div
                onClick={() => setExpanded(prev => prev === g.id ? null : g.id)}
                className="card" style={{ cursor: 'pointer', padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 14, color: '#EFEFEF', marginBottom: 4 }}>
                      {g.white} vs {g.black} {g.result && <span style={{ color: '#7A7A9A', fontWeight: 400 }}>· {g.result}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter', display: 'flex', gap: 12 }}>
                      <span>{new Date(g.created_at).toLocaleDateString()}</span>
                      {g.analysis?.erros && <span>{g.analysis.erros.length} errors found</span>}
                      {g.analysis?.nivel_estimado && <span>ELO ~{g.analysis.nivel_estimado}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={e => deleteGame(g.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7A9A', padding: 4, borderRadius: 6 }}
                      className="hover:text-red-400">
                      <Trash2 size={15} />
                    </button>
                    {expanded === g.id ? <ChevronUp size={16} color="#7A7A9A" /> : <ChevronDown size={16} color="#7A7A9A" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expanded === g.id && g.analysis && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}>
                    <div style={{ background: '#10101E', border: '1px solid #1E1E32', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '20px 20px 20px' }}>
                      {g.analysis.resumo_geral && (
                        <p style={{ color: '#EFEFEF', fontSize: 13, lineHeight: 1.7, fontFamily: 'Inter', marginBottom: 16, padding: '12px 16px', background: 'rgba(0,229,160,0.05)', borderRadius: 10, border: '1px solid rgba(0,229,160,0.12)' }}>
                          {g.analysis.resumo_geral}
                        </p>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {g.analysis.erros?.map((err, j) => (
                          <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', background: '#080810', borderRadius: 10 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: SEV_COLOR[err.gravidade] || '#7A7A9A', flexShrink: 0, marginTop: 5 }} />
                            <div>
                              <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, color: CAT_COLOR[err.categoria] || '#7A7A9A', fontFamily: 'Inter', textTransform: 'capitalize' }}>{err.categoria}</span>
                                {err.lance && <span style={{ fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter' }}>Move {err.lance}</span>}
                              </div>
                              <p style={{ margin: 0, fontSize: 13, color: '#EFEFEF', lineHeight: 1.5, fontFamily: 'Inter' }}>{err.descricao}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
