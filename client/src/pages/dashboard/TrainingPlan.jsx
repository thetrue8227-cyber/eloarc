import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../../components/SkeletonCard';
import { RefreshCw, ExternalLink, BookOpen, Target, CheckSquare, Square, ChevronRight } from 'lucide-react';

const WEEK_COLORS = ['#7C6AF7', '#00E5A0', '#FFD700', '#FF6B6B'];
const WEEK_KEYS = ['semana_1', 'semana_2', 'semana_3', 'semana_4'];

function ChecklistItem({ text, checked, onToggle }) {
  return (
    <button onClick={onToggle} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', textAlign: 'left' }}>
      {checked
        ? <CheckSquare size={16} color="#00E5A0" style={{ flexShrink: 0, marginTop: 1 }} />
        : <Square size={16} color="#3A3A5C" style={{ flexShrink: 0, marginTop: 1 }} />}
      <span style={{ fontSize: 13, fontFamily: 'Inter', color: checked ? '#7A7A9A' : '#EFEFEF', lineHeight: 1.5, textDecoration: checked ? 'line-through' : 'none', transition: 'all 0.2s' }}>
        {text}
      </span>
    </button>
  );
}

export default function TrainingPlan() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    api.get('/training').then(r => setData(r.data)).finally(() => setLoading(false));
    const saved = localStorage.getItem('training_checked');
    if (saved) setChecked(JSON.parse(saved));
  }, []);

  const toggleCheck = (key) => {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('training_checked', JSON.stringify(next));
      return next;
    });
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const { data: r } = await api.post('/training/regenerate');
      setData(prev => ({ plans: [r.plan, ...prev.plans.map(p => ({ ...p, is_active: false }))], active: r.plan }));
      setChecked({});
      localStorage.removeItem('training_checked');
      toast.success('Plano de treino atualizado!');
    } catch (err) {
      toast.error(err.response?.data?.error || t('errors.generic'));
    } finally { setRegenerating(false); }
  };

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}><SkeletonCard height={200} /><SkeletonCard height={300} /></div>;

  const active = data?.active;
  const semanas = active?.semanas;
  const currentWeek = semanas ? semanas[WEEK_KEYS[activeWeek]] : null;
  const metas = active?.metas;
  const repertorio = active?.repertorio_recomendado;
  const gms = active?.gm_games;

  // Count progress for current week
  const weekActivities = currentWeek?.sessoes?.flatMap(s => s.atividades || []) || [];
  const weekChecked = weekActivities.filter((_, i) => checked[`w${activeWeek}_${i}`]).length;
  const progress = weekActivities.length ? Math.round((weekChecked / weekActivities.length) * 100) : 0;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, marginBottom: 6, color: '#EFEFEF' }}>{t('training.title')}</h1>
          <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>Seu roteiro personalizado de 4 semanas</p>
        </div>
        <button onClick={regenerate} disabled={regenerating} className="btn-secondary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} style={{ animation: regenerating ? 'spin 1s linear infinite' : 'none' }} />
          {regenerating ? 'Atualizando...' : t('training.regenerate')}
        </button>
      </motion.div>

      {!active ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card"
          style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 18, color: '#EFEFEF', marginBottom: 8 }}>Nenhum plano ainda</div>
          <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', marginBottom: 24 }}>Analise uma partida para gerar seu plano de treino personalizado.</p>
          <a href="/dashboard/analyze" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none', fontSize: 14, padding: '10px 24px' }}>
            Analisar uma partida
          </a>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Current focus */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
            style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.25)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 11, color: '#7C6AF7', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter', marginBottom: 6 }}>Foco atual</div>
            <h2 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 20, color: '#EFEFEF', marginBottom: 8 }}>{active.focus}</h2>
            {active.description && (
              <p style={{ color: '#7A7A9A', fontSize: 13, lineHeight: 1.7, fontFamily: 'Inter', margin: 0 }}>{active.description}</p>
            )}
          </motion.div>

          {/* Week tabs */}
          {semanas && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {WEEK_KEYS.map((wk, i) => {
                  const wd = semanas[wk];
                  if (!wd) return null;
                  const color = WEEK_COLORS[i];
                  const isActive = activeWeek === i;
                  return (
                    <button key={wk} onClick={() => setActiveWeek(i)}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `1px solid ${isActive ? color : '#1E1E32'}`, background: isActive ? `${color}12` : 'transparent', cursor: 'pointer', fontFamily: 'Inter', fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? color : '#7A7A9A', transition: 'all 0.15s' }}>
                      Sem. {i + 1}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {currentWeek && (
                  <motion.div key={activeWeek} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 17, color: '#EFEFEF' }}>{currentWeek.tema}</div>
                        {currentWeek.foco && <div style={{ fontSize: 13, color: '#7A7A9A', fontFamily: 'Inter', marginTop: 2 }}>{currentWeek.foco}</div>}
                      </div>
                      {weekActivities.length > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontFamily: 'Inter', color: WEEK_COLORS[activeWeek], fontWeight: 600 }}>{progress}%</div>
                          <div style={{ fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter' }}>{weekChecked}/{weekActivities.length}</div>
                        </div>
                      )}
                    </div>

                    {weekActivities.length > 0 && (
                      <div style={{ height: 4, borderRadius: 4, background: '#1E1E32', marginBottom: 20, overflow: 'hidden' }}>
                        <motion.div animate={{ width: `${progress}%` }} style={{ height: '100%', background: WEEK_COLORS[activeWeek], borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    )}

                    {currentWeek.sessoes?.map((sessao, si) => (
                      <div key={si} style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, color: WEEK_COLORS[activeWeek], fontFamily: 'Inter', fontWeight: 600, marginBottom: 8 }}>
                          {sessao.dia} — {sessao.duracao}
                        </div>
                        <div style={{ paddingLeft: 4 }}>
                          {sessao.atividades?.map((a, ai) => {
                            let actIdx = 0;
                            for (let s = 0; s < si; s++) actIdx += (currentWeek.sessoes[s].atividades?.length || 0);
                            actIdx += ai;
                            const ck = `w${activeWeek}_${actIdx}`;
                            return <ChecklistItem key={ai} text={a} checked={!!checked[ck]} onToggle={() => toggleCheck(ck)} />;
                          })}
                        </div>
                      </div>
                    ))}

                    {currentWeek.checkpoint && (
                      <div style={{ marginTop: 12, padding: '10px 14px', background: `${WEEK_COLORS[activeWeek]}10`, border: `1px solid ${WEEK_COLORS[activeWeek]}30`, borderRadius: 10, fontSize: 13, color: WEEK_COLORS[activeWeek], fontFamily: 'Inter' }}>
                        <strong>Checkpoint:</strong> {currentWeek.checkpoint}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Fallback: themes + exercises (old format) */}
          {!semanas && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <BookOpen size={16} color="#00E5A0" />
                  <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 15, color: '#EFEFEF', margin: 0 }}>{t('training.themes')}</h3>
                </div>
                {(active.themes || []).map((theme, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 10, fontSize: 14, fontFamily: 'Inter', color: '#EFEFEF', marginBottom: 8 }}>
                    {theme}
                  </div>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Target size={16} color="#7C6AF7" />
                  <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 15, color: '#EFEFEF', margin: 0 }}>{t('training.exercises')}</h3>
                </div>
                {(active.exercises || []).map((ex, i) => (
                  <ChecklistItem key={i} text={`${i + 1}. ${ex}`} checked={!!checked[`ex_${i}`]} onToggle={() => toggleCheck(`ex_${i}`)} />
                ))}
                <a href="https://lichess.org/training" target="_blank" rel="noopener noreferrer"
                  className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, fontSize: 13, padding: 10, textDecoration: 'none' }}>
                  {t('training.practice_lichess')} <ExternalLink size={14} />
                </a>
              </motion.div>
            </div>
          )}

          {/* Goals / Metas */}
          {metas && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card" style={{ padding: 24 }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 15, color: '#EFEFEF', marginBottom: 16 }}>Metas de ELO</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'ELO atual', val: metas.elo_atual_estimado || metas.curto_prazo, color: '#7A7A9A' },
                  { label: '30 dias', val: metas.elo_30_dias || metas.medio_prazo, color: '#7C6AF7' },
                  { label: '60 dias', val: metas.elo_60_dias || metas.elo_previsto_60_dias, color: '#00E5A0' },
                ].map(({ label, val }) => val ? (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E32', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 20, color: WEEK_COLORS[0], marginBottom: 4 }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter' }}>{label}</div>
                  </div>
                ) : null)}
              </div>
              {metas.condicao && (
                <div style={{ marginTop: 12, fontSize: 13, color: '#7A7A9A', fontFamily: 'Inter', fontStyle: 'italic' }}>
                  {metas.condicao}
                </div>
              )}
            </motion.div>
          )}

          {/* Repertoire */}
          {repertorio && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="card" style={{ padding: 24 }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 15, color: '#EFEFEF', marginBottom: 16 }}>Repertório recomendado</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Com as brancas', val: repertorio.brancas, color: '#EFEFEF' },
                  { label: 'Com as pretas vs e4', val: repertorio.pretas_contra_e4, color: '#EFEFEF' },
                  { label: 'Com as pretas vs d4', val: repertorio.pretas_contra_d4, color: '#EFEFEF' },
                ].map(({ label, val, color }) => val ? (
                  <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 11, color: '#7C6AF7', fontWeight: 700, fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0, paddingTop: 2, minWidth: 140 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#EFEFEF', fontFamily: 'Inter', lineHeight: 1.5 }}>{val}</div>
                  </div>
                ) : null)}
              </div>
              {repertorio.justificativa && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 10, fontSize: 13, color: '#7A7A9A', fontFamily: 'Inter', lineHeight: 1.6 }}>
                  {repertorio.justificativa}
                </div>
              )}
            </motion.div>
          )}

          {/* GM games */}
          {gms && gms.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="card" style={{ padding: 24 }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 15, color: '#EFEFEF', marginBottom: 16 }}>Partidas de GM para estudar</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {gms.map((g, i) => (
                  <a key={i}
                    href={`https://lichess.org/games/search?players=${encodeURIComponent(g.jogadores?.split(' vs ')[0] || '')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1E1E32', borderRadius: 10, textDecoration: 'none' }}>
                    <div>
                      <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 13, color: '#EFEFEF', marginBottom: 2 }}>
                        {g.jogadores} {g.ano ? `(${g.ano})` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>{g.motivo}</div>
                    </div>
                    <ChevronRight size={14} color="#7A7A9A" style={{ flexShrink: 0, marginTop: 2 }} />
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* History */}
          {data?.plans?.filter(p => !p.is_active).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 15, marginBottom: 16, color: '#EFEFEF' }}>{t('training.history_title')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.plans.filter(p => !p.is_active).slice(0, 5).map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid #1E1E32', borderRadius: 10 }}>
                    <span style={{ fontSize: 14, color: '#7A7A9A', fontFamily: 'Inter' }}>{p.focus}</span>
                    <span style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
