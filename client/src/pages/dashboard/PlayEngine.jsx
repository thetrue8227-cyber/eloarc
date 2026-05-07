import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ELO_LIMITS = { free: 1200, pawn: 2000, knight: 2400, king: 2800 };

export default function PlayEngine() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [game, setGame] = useState(new Chess());
  const [position, setPosition] = useState('start');
  const [playerColor, setPlayerColor] = useState('white');
  const [eloTarget, setEloTarget] = useState(800);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const stockfishRef = useRef(null);
  const gameRef = useRef(game);

  const maxElo = ELO_LIMITS[user?.plan] || 1200;

  useEffect(() => {
    try {
      const w = new Worker('/stockfish.js');
      stockfishRef.current = w;
      w.postMessage('uci');
      w.addEventListener('message', (e) => { if (e.data === 'uciok') setEngineReady(true); });
      return () => w.terminate();
    } catch {
      toast.error(t('play.engine_unavailable'));
    }
  }, [t]);

  const engineMove = useCallback((currentGame) => {
    const sf = stockfishRef.current;
    if (!sf) return;
    setThinking(true);
    const depth = Math.max(1, Math.min(15, Math.round(eloTarget / 200)));
    sf.postMessage(`position fen ${currentGame.fen()}`);
    sf.postMessage(`go depth ${depth} movetime 500`);
    sf.onmessage = (e) => {
      if (e.data.startsWith('bestmove')) {
        const move = e.data.split(' ')[1];
        if (move && move !== '(none)') {
          setGame(prev => {
            const g = new Chess(prev.fen());
            try {
              g.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] || 'q' });
              setPosition(g.fen());
              gameRef.current = g;
              if (g.isGameOver()) {
                setGameOver(g.isCheckmate() ? (g.turn() === 'w' ? t('play.you_win') : t('play.you_lose')) : t('play.draw'));
              }
            } catch {}
            return g;
          });
        }
        setThinking(false);
      }
    };
  }, [eloTarget, t]);

  const onDrop = useCallback((sourceSquare, targetSquare) => {
    if (!started || thinking || gameOver) return false;
    const g = new Chess(gameRef.current.fen());
    if ((g.turn() === 'w') !== (playerColor === 'white')) return false;
    try {
      const move = g.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (!move) return false;
      gameRef.current = g;
      setGame(g);
      setPosition(g.fen());
      if (g.isGameOver()) {
        setGameOver(g.isCheckmate() ? (g.turn() === 'w' ? t('play.you_win') : t('play.you_lose')) : t('play.draw'));
        return true;
      }
      setTimeout(() => engineMove(g), 300);
      return true;
    } catch { return false; }
  }, [started, thinking, gameOver, playerColor, engineMove]);

  const startGame = () => {
    const g = new Chess();
    gameRef.current = g;
    setGame(g);
    setPosition('start');
    setGameOver(null);
    setStarted(true);
    if (playerColor === 'black') setTimeout(() => engineMove(g), 500);
  };

  const resign = () => {
    setGameOver(t('play.resigned'));
    setStarted(false);
  };

  const moveHistory = game.history().reduce((acc, move, i) => {
    if (i % 2 === 0) acc.push(`${Math.floor(i / 2) + 1}. ${move}`);
    else acc[acc.length - 1] += ` ${move}`;
    return acc;
  }, []);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, color: '#EFEFEF', marginBottom: 4 }}>{t('play.title')}</h1>
        <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>{t('play.subtitle')}</p>
      </motion.div>

      {/* Layout: board left (max 480px), panel right */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Board */}
        <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 480 }}>
          <div style={{ position: 'relative', aspectRatio: '1', maxWidth: 480, width: '100%' }}>
            <Chessboard
              position={position}
              onPieceDrop={onDrop}
              boardOrientation={playerColor}
              boardStyle={{ borderRadius: 12, boxShadow: '0 0 40px rgba(124,106,247,0.18)', width: '100%' }}
              customDarkSquareStyle={{ backgroundColor: '#1E1E32' }}
              customLightSquareStyle={{ backgroundColor: '#2A2A40' }}
            />
          </div>
          {thinking && (
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: '#7C6AF7', fontFamily: 'Inter', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #7C6AF7', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
              {t('play.engine_thinking')}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ flex: '1 1 280px', minWidth: 260, maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!started ? (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 8, fontFamily: 'Inter' }}>
                  {t('play.difficulty')} — <span style={{ color: '#7C6AF7', fontWeight: 700 }}>{eloTarget}</span>
                </label>
                <input type="range" min={200} max={maxElo} step={50} value={eloTarget}
                  onChange={e => setEloTarget(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#7C6AF7' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter', marginTop: 4 }}>
                  <span>200</span><span>{maxElo}</span>
                </div>
                {maxElo < 2800 && (
                  <div style={{ fontSize: 11, color: '#7C6AF7', marginTop: 6, fontFamily: 'Inter' }}>
                    {t('play.upgrade_for_higher_elo')}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 8, fontFamily: 'Inter' }}>{t('play.color')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['white', 'black'].map(c => (
                    <button key={c} onClick={() => setPlayerColor(c)}
                      style={{ flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${playerColor === c ? '#7C6AF7' : '#1E1E32'}`, background: playerColor === c ? 'rgba(124,106,247,0.12)' : 'transparent', color: '#EFEFEF', cursor: 'pointer', fontFamily: 'Inter', fontSize: 13, transition: 'all 0.15s' }}>
                      {c === 'white' ? `♔ ${t('play.white')}` : `♚ ${t('play.black')}`}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={startGame} disabled={!engineReady} className="btn-primary" style={{ width: '100%', fontSize: 15 }}>
                {engineReady ? t('play.start') : t('play.loading_engine')}
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter', marginBottom: 2 }}>
                {t('play.playing_as')} {playerColor === 'white' ? t('play.white').toLowerCase() : t('play.black').toLowerCase()}
              </div>
              <div style={{ fontSize: 16, fontFamily: 'Sora', fontWeight: 700, color: '#EFEFEF', marginBottom: 16 }}>
                {t('play.vs_engine')} {eloTarget}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={resign} className="btn-secondary" style={{ fontSize: 13 }}>{t('play.resign')}</button>
                <button onClick={startGame} className="btn-secondary" style={{ fontSize: 13 }}>{t('play.new_game')}</button>
              </div>
            </div>
          )}

          {/* Move history */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 14, color: '#EFEFEF', marginBottom: 10 }}>{t('play.moves')}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#7A7A9A', maxHeight: 220, overflowY: 'auto', lineHeight: 2 }}>
              {moveHistory.length === 0 ? (
                <span style={{ color: '#3A3A5C' }}>{t('play.no_moves')}</span>
              ) : (
                moveHistory.map((line, i) => <div key={i} style={{ color: i === moveHistory.length - 1 ? '#EFEFEF' : '#7A7A9A' }}>{line}</div>)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game over overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="card" style={{ padding: '44px 40px', textAlign: 'center', maxWidth: 360 }}>
              <div style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 32, marginBottom: 8 }} className="gradient-text">{gameOver}</div>
              <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', marginBottom: 24 }}>{t('play.game_over')}</p>
              <button onClick={() => { setGameOver(null); setStarted(false); }} className="btn-primary" style={{ fontSize: 14, padding: '12px 28px' }}>
                {t('play.new_game')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
