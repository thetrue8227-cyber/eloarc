import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, ChevronDown, ChevronUp, Repeat2, CheckCircle, SkipBack, ChevronLeft, ChevronRight, SkipForward, Play, Pause } from 'lucide-react';

const SEVERITY_KEY = {
  inaccuracy: 'low', mistake: 'medium', blunder: 'blunder', critical_blunder: 'high',
  low: 'low', medium: 'medium', high: 'high',
};
const SEVERITY_STYLE = {
  low:     { bg: 'rgba(0,229,160,0.08)',  border: 'rgba(0,229,160,0.25)',  color: '#00E5A0' },
  medium:  { bg: 'rgba(255,213,0,0.08)',  border: 'rgba(255,213,0,0.3)',   color: '#FFD500' },
  blunder: { bg: 'rgba(255,140,0,0.08)',  border: 'rgba(255,140,0,0.3)',   color: '#FF8C00' },
  high:    { bg: 'rgba(255,77,79,0.08)',  border: 'rgba(255,77,79,0.3)',   color: '#FF4D4F' },
};
const CAT_COLORS = { opening: '#7C6AF7', tactics: '#FF6B6B', positional: '#FFD700', endgame: '#00E5A0' };
const CAT_LABEL_KEY = { opening: 'category_opening', tactics: 'category_tactics', positional: 'category_positional', endgame: 'category_endgame' };
const WEEK_COLORS = ['#7C6AF7', '#00E5A0', '#FFD700', '#FF6B6B'];

// Build list of FENs from a PGN
function buildFens(pgn) {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });
    const fens = ['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'];
    const c2 = new Chess();
    for (const move of history) {
      c2.move(move);
      fens.push(c2.fen());
    }
    return { fens, moves: history };
  } catch {
    return { fens: [], moves: [] };
  }
}

function ErrorCard({ err, index, onJumpToMove }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const sevKey = SEVERITY_KEY[err.gravidade] || 'low';
  const sev = SEVERITY_STYLE[sevKey];
  const sevLabel = t(`analyze.${sevKey}`);
  const moveNum = parseInt(err.lance);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      style={{ background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: sev.color, fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>{sevLabel}</span>
        {err.categoria && (
          <span style={{ fontSize: 11, background: `${CAT_COLORS[err.categoria]}22`, color: CAT_COLORS[err.categoria], borderRadius: 6, padding: '2px 7px', fontFamily: 'Inter', flexShrink: 0 }}>
            {CAT_LABEL_KEY[err.categoria] ? t(`analyze.${CAT_LABEL_KEY[err.categoria]}`) : err.categoria}
          </span>
        )}
        {err.lance && <span style={{ fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter', flexShrink: 0 }}>#{err.lance}</span>}
        {err.recorrente && <Repeat2 size={11} color="#FF8C00" style={{ flexShrink: 0 }} />}
        {onJumpToMove && moveNum && (
          <button onClick={e => { e.stopPropagation(); onJumpToMove(moveNum); }}
            style={{ marginLeft: 'auto', fontSize: 10, color: '#7C6AF7', background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.3)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'Inter', flexShrink: 0 }}>
            {t('analyze.view_on_board')}
          </button>
        )}
        <span style={{ color: '#7A7A9A', flexShrink: 0, marginLeft: onJumpToMove && moveNum ? 0 : 'auto' }}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 14px 12px' }}>
              {(err.movimento_jogado || err.movimento_correto) && (
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  {err.movimento_jogado && (
                    <div style={{ flex: 1, background: 'rgba(255,77,79,0.08)', border: '1px solid rgba(255,77,79,0.2)', borderRadius: 8, padding: '7px 10px' }}>
                      <div style={{ fontSize: 10, color: '#FF4D4F', fontFamily: 'Inter', fontWeight: 600, marginBottom: 2 }}>{t('analyze.played')}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#EFEFEF' }}>{err.movimento_jogado}</div>
                    </div>
                  )}
                  {err.movimento_correto && (
                    <div style={{ flex: 1, background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, padding: '7px 10px' }}>
                      <div style={{ fontSize: 10, color: '#00E5A0', fontFamily: 'Inter', fontWeight: 600, marginBottom: 2 }}>{t('analyze.best')}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#EFEFEF' }}>{err.movimento_correto}</div>
                    </div>
                  )}
                </div>
              )}
              <p style={{ fontSize: 13, color: '#EFEFEF', margin: 0, lineHeight: 1.6, fontFamily: 'Inter' }}>
                {err.explicacao || err.descricao}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WeekCard({ data, index }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(index === 0);
  const color = WEEK_COLORS[index];
  return (
    <div style={{ border: `1px solid ${open ? color + '40' : '#1E1E32'}`, borderRadius: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '12px 14px', background: open ? `${color}08` : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color, fontFamily: 'Inter', flexShrink: 0 }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 }}>{t('analyze.week')} {index + 1}</div>
          <div style={{ fontSize: 13, fontFamily: 'Sora', fontWeight: 600, color: '#EFEFEF' }}>{data?.tema}</div>
        </div>
        <span style={{ color: '#7A7A9A' }}>{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 14px 14px' }}>
              {data?.sessoes?.map((s, si) => (
                <div key={si} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color, fontFamily: 'Inter', fontWeight: 600, marginBottom: 4 }}>{s.dia} — {s.duracao}</div>
                  {s.atividades?.map((a, ai) => (
                    <div key={ai} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 12, color: '#EFEFEF', fontFamily: 'Inter', lineHeight: 1.5 }}>{a}</span>
                    </div>
                  ))}
                </div>
              ))}
              {data?.checkpoint && (
                <div style={{ marginTop: 6, padding: '7px 10px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8, fontSize: 12, color, fontFamily: 'Inter' }}>
                  {t('analyze.checkpoint')}: {data.checkpoint}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Interactive board component
function GameBoard({ pgn, errors, jumpTarget }) {
  const { t } = useTranslation();
  const { fens, moves } = buildFens(pgn);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  const errorMoves = new Set(errors?.map(e => parseInt(e.lance)).filter(Boolean));
  const blunderMoves = new Set(
    errors?.filter(e => e.gravidade === 'blunder' || e.gravidade === 'critical_blunder')
      .map(e => parseInt(e.lance)).filter(Boolean)
  );

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [pgn]);

  const goTo = useCallback((n) => {
    setPlaying(false);
    setIdx(Math.max(0, Math.min(n, fens.length - 1)));
  }, [fens.length]);

  useEffect(() => {
    if (jumpTarget != null) goTo(jumpTarget);
  }, [jumpTarget, goTo]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setIdx(prev => {
          if (prev >= fens.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, fens.length]);

  if (!fens.length) return null;

  // Highlight squares for current error
  const currentMoveNum = Math.ceil(idx / 2);
  const isErrorMove = idx > 0 && errorMoves.has(currentMoveNum);
  const isBlunder = idx > 0 && blunderMoves.has(currentMoveNum);
  const lastMove = idx > 0 ? moves[idx - 1] : null;

  const customSquareStyles = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: isBlunder ? 'rgba(255,77,79,0.3)' : isErrorMove ? 'rgba(255,213,0,0.3)' : 'rgba(124,106,247,0.25)' };
    customSquareStyles[lastMove.to] = { backgroundColor: isBlunder ? 'rgba(255,77,79,0.4)' : isErrorMove ? 'rgba(255,213,0,0.4)' : 'rgba(124,106,247,0.35)' };
  }

  const moveList = moves.reduce((acc, m, i) => {
    if (i % 2 === 0) acc.push({ num: Math.floor(i / 2) + 1, white: m.san, blackIdx: i + 1 });
    else acc[acc.length - 1].black = m.san;
    return acc;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Board */}
      <div style={{ maxWidth: 480, width: '100%' }}>
        <Chessboard
          position={fens[idx]}
          arePiecesDraggable={false}
          boardStyle={{ borderRadius: 10, boxShadow: '0 0 32px rgba(124,106,247,0.15)', width: '100%' }}
          customDarkSquareStyle={{ backgroundColor: '#1E1E32' }}
          customLightSquareStyle={{ backgroundColor: '#2A2A40' }}
          customSquareStyles={customSquareStyles}
        />
      </div>

      {/* Error badge */}
      {isErrorMove && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '6px 12px', borderRadius: 8, background: isBlunder ? 'rgba(255,77,79,0.1)' : 'rgba(255,213,0,0.1)', border: `1px solid ${isBlunder ? 'rgba(255,77,79,0.3)' : 'rgba(255,213,0,0.3)'}`, fontSize: 12, color: isBlunder ? '#FF4D4F' : '#FFD500', fontFamily: 'Inter', fontWeight: 600, textAlign: 'center' }}>
          {isBlunder ? t('analyze.blunder_here') : t('analyze.inaccuracy_here')}
        </motion.div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => goTo(0)} style={navBtnStyle}><SkipBack size={14} /></button>
        <button onClick={() => goTo(idx - 1)} style={navBtnStyle} disabled={idx === 0}><ChevronLeft size={14} /></button>
        <button onClick={() => setPlaying(p => !p)} style={{ ...navBtnStyle, background: playing ? 'rgba(124,106,247,0.2)' : 'rgba(124,106,247,0.08)', color: '#7C6AF7', padding: '7px 16px', minWidth: 64 }}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => goTo(idx + 1)} style={navBtnStyle} disabled={idx >= fens.length - 1}><ChevronRight size={14} /></button>
        <button onClick={() => goTo(fens.length - 1)} style={navBtnStyle}><SkipForward size={14} /></button>
        <span style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter', marginLeft: 4 }}>
          {idx}/{fens.length - 1}
        </span>
      </div>

      {/* Move list */}
      <div style={{ maxHeight: 140, overflowY: 'auto', padding: '8px 4px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {moveList.map((row) => (
            <div key={row.num} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#3A3A5C', fontFamily: 'monospace', minWidth: 18 }}>{row.num}.</span>
              <button onClick={() => goTo(row.num * 2 - 1)}
                style={{ fontSize: 12, fontFamily: 'monospace', padding: '2px 5px', borderRadius: 5, border: 'none', cursor: 'pointer', background: idx === row.num * 2 - 1 ? '#7C6AF7' : errorMoves.has(row.num) ? 'rgba(255,77,79,0.15)' : 'transparent', color: idx === row.num * 2 - 1 ? '#fff' : errorMoves.has(row.num) ? '#FF6B6B' : '#7A7A9A', transition: 'all 0.1s' }}>
                {row.white}
              </button>
              {row.black && (
                <button onClick={() => goTo(row.num * 2)}
                  style={{ fontSize: 12, fontFamily: 'monospace', padding: '2px 5px', borderRadius: 5, border: 'none', cursor: 'pointer', background: idx === row.num * 2 ? '#7C6AF7' : errorMoves.has(row.num) ? 'rgba(255,77,79,0.15)' : 'transparent', color: idx === row.num * 2 ? '#fff' : errorMoves.has(row.num) ? '#FF6B6B' : '#7A7A9A', transition: 'all 0.1s' }}>
                  {row.black}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid #1E1E32', background: 'rgba(255,255,255,0.03)',
  color: '#7A7A9A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
};

export default function AnalyzeGame() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('pgn');
  const [pgn, setPgn] = useState('');
  const [username, setUsername] = useState('');
  const [previewed, setPreviewed] = useState(null);
  const [activePgn, setActivePgn] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState(null);
  const boardRef = useRef(null);

  const platform = tab === 'lichess' ? 'lichess' : 'chesscom';

  const previewPlatform = async () => {
    if (!username.trim()) return;
    setPreviewing(true);
    try {
      const { data } = await api.get('/import/preview', { params: { platform, username: username.trim() } });
      setPreviewed(data);
      toast.success(`${data.count} ${t('analyze.games_found_short')}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('analyze.user_not_found'));
    } finally { setPreviewing(false); }
  };

  const analyzeFromPlatform = async () => {
    if (!previewed?.pgns?.length) return;
    setLoading(true);
    setResult(null);
    const selectedPgn = previewed.pgns[0];
    try {
      const { data } = await api.post('/import/single', { pgn: selectedPgn, platform, username: username.trim() });
      setResult(data.analysis || data);
      setActivePgn(selectedPgn);
      toast.success(t('analyze.complete'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('errors.generic'));
    } finally { setLoading(false); }
  };

  const analyzePgn = async () => {
    if (!pgn.trim()) { toast.error(t('errors.invalid_pgn')); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/games/analyze', { pgn });
      setResult(data.analysis || data);
      setActivePgn(pgn);
      toast.success(t('analyze.complete'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || t('errors.generic'));
    } finally { setLoading(false); }
  };

  const [jumpTarget, setJumpTarget] = useState(null);

  const jumpToMove = (moveNum) => {
    setJumpTarget(moveNum * 2 - 1);
    boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const analysis = result;
  const erros = analysis?.erros || [];
  const pontos = analysis?.pontos_fortes || [];
  const plano = analysis?.plano_treino_imediato;
  const metas = analysis?.metas;

  const TABS = [
    { id: 'lichess', label: 'Lichess' },
    { id: 'chesscom', label: 'Chess.com' },
    { id: 'pgn', label: t('analyze.tab_pgn') },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, marginBottom: 6, color: '#EFEFEF' }}>{t('analyze.title')}</h1>
        <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>{t('dashboard.subtitle')}</p>
      </motion.div>

      {/* Input section */}
      <motion.div layout style={{ marginBottom: 24 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: '#0E0E1A', borderRadius: 12, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setPreviewed(null); setResult(null); setActivePgn(''); }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                background: tab === t.id ? 'rgba(124,106,247,0.15)' : 'transparent',
                color: tab === t.id ? '#EFEFEF' : '#7A7A9A', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 22 }}>
          {tab === 'pgn' ? (
            <>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 8, fontFamily: 'Inter' }}>PGN</label>
              <textarea value={pgn} onChange={e => setPgn(e.target.value)}
                placeholder={t('analyze.paste_pgn')}
                style={{ width: '100%', minHeight: 160, background: '#080810', border: '1px solid #1E1E32', borderRadius: 10, padding: '12px 14px', color: '#EFEFEF', fontFamily: 'monospace', fontSize: 12, resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#7C6AF7'}
                onBlur={e => e.target.style.borderColor = '#1E1E32'}
              />
              <button onClick={analyzePgn} disabled={loading || !pgn.trim()} className="btn-primary" style={{ width: '100%', marginTop: 12, fontSize: 14, padding: 12 }}>
                {loading ? <Spinner text={t('analyze.analyzing')} /> : <><Search size={14} style={{ marginRight: 6 }} /> {t('analyze.analyze_btn')}</>}
              </button>
            </>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 8, fontFamily: 'Inter' }}>
                {t('analyze.username_label')} {tab === 'lichess' ? 'Lichess' : 'Chess.com'}
              </label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <input value={username} onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && username.trim() && previewPlatform()}
                  placeholder="magnus_carlsen" className="input-field" style={{ flex: 1 }} />
                <button onClick={previewPlatform} disabled={previewing || !username.trim()} className="btn-secondary" style={{ padding: '0 16px', fontSize: 13 }}>
                  {previewing ? '...' : t('analyze.find_games')}
                </button>
              </div>
              {previewed && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ padding: '10px 12px', background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: '#00E5A0', fontFamily: 'Inter', fontWeight: 600 }}>
                      {t('analyze.games_found', { count: previewed.count })}
                    </div>
                  </div>
                  <button onClick={analyzeFromPlatform} disabled={loading} className="btn-primary" style={{ width: '100%', fontSize: 14, padding: 12 }}>
                    {loading ? <Spinner text={t('analyze.analyzing')} /> : <><Search size={14} style={{ marginRight: 6 }} /> {t('analyze.analyze_latest')}</>}
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(124,106,247,0.07)', borderRadius: 12, border: '1px solid rgba(124,106,247,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#7C6AF7', fontFamily: 'Inter' }}>{t('analyze.thinking')}</div>
          </motion.div>
        )}
      </motion.div>

      {/* Results: board + analysis side by side */}
      <AnimatePresence>
        {analysis && activePgn && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 480px) 1fr', gap: 24, alignItems: 'start' }}>

            {/* Left: interactive board */}
            <div ref={boardRef}>
              <GameBoard pgn={activePgn} errors={erros} jumpTarget={jumpTarget} />
            </div>

            {/* Right: analysis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              {/* General */}
              <div className="card" style={{ padding: 20, background: 'rgba(0,229,160,0.03)', border: '1px solid rgba(0,229,160,0.12)' }}>
                <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 14, color: '#00E5A0', marginBottom: 8 }}>{t('analyze.general_analysis')}</div>
                <p style={{ color: '#EFEFEF', fontSize: 13, lineHeight: 1.7, fontFamily: 'Inter', margin: 0 }}>
                  {analysis.analise_geral || analysis.resumo_geral}
                </p>
                {analysis.perfil_update?.elo_estimado && (
                  <div style={{ marginTop: 10, display: 'inline-block', background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.3)', borderRadius: 8, padding: '3px 12px', fontSize: 13, color: '#7C6AF7', fontFamily: 'Inter', fontWeight: 600 }}>
                    {t('analyze.elo_estimated')}: {analysis.perfil_update.elo_estimado}
                  </div>
                )}
              </div>

              {/* Strong points */}
              {pontos.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <CheckCircle size={14} color="#00E5A0" />
                    <span style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 14, color: '#EFEFEF' }}>{t('analyze.strong_points')}</span>
                  </div>
                  {pontos.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00E5A0', flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 13, color: '#EFEFEF', fontFamily: 'Inter', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Errors */}
              {erros.length > 0 && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 14, color: '#EFEFEF', marginBottom: 12 }}>
                    {t('analyze.errors_found')} ({erros.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {erros.map((err, i) => <ErrorCard key={i} err={err} index={i} onJumpToMove={jumpToMove} />)}
                  </div>
                </div>
              )}

              {/* Training plan */}
              {plano && (
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 14, color: '#EFEFEF', marginBottom: 4 }}>{t('analyze.training_plan')}</div>
                  {plano.foco_principal && <div style={{ fontSize: 12, color: '#7C6AF7', fontFamily: 'Inter', marginBottom: 12 }}>{t('analyze.focus')}: {plano.foco_principal}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {['semana_1','semana_2','semana_3','semana_4'].map((wk, i) =>
                      plano[wk] ? <WeekCard key={wk} data={plano[wk]} index={i} /> : null
                    )}
                  </div>
                </div>
              )}

              {/* Goals */}
              {metas && (
                <div className="card" style={{ padding: 18, background: 'rgba(124,106,247,0.04)', border: '1px solid rgba(124,106,247,0.15)' }}>
                  <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 14, color: '#EFEFEF', marginBottom: 12 }}>{t('analyze.goals')}</div>
                  {metas.curto_prazo && <div style={{ fontSize: 13, color: '#EFEFEF', fontFamily: 'Inter', marginBottom: 6 }}>◆ {metas.curto_prazo}</div>}
                  {metas.medio_prazo && <div style={{ fontSize: 13, color: '#EFEFEF', fontFamily: 'Inter', marginBottom: 6 }}>◆ {metas.medio_prazo}</div>}
                  {metas.elo_previsto_60_dias && (
                    <div style={{ marginTop: 8, display: 'inline-block', background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: 13, color: '#7C6AF7', fontFamily: 'Inter', fontWeight: 600 }}>
                      {t('analyze.elo_in_60_days')}: ~{metas.elo_previsto_60_dias}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Spinner({ text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      {text}
    </span>
  );
}
