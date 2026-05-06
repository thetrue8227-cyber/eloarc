import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

const LOADING_MESSAGES = [
  'Buscando suas partidas...',
  'Analisando seus erros recorrentes...',
  'Identificando seus pontos cegos...',
  'Montando seu perfil de jogador...',
  'Gerando seu plano de treino de 30 dias...',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [pgns, setPgns] = useState([]);

  const skip = () => {
    localStorage.removeItem('needs_onboarding');
    navigate('/dashboard');
  };

  const preview = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get('/import/preview', { params: { platform, username: username.trim() } });
      setPgns(data.pgns);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao buscar partidas');
    } finally { setLoading(false); }
  };

  const importAndAnalyze = async () => {
    setLoading(true);
    setStep(4);
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setMsgIndex(i);
    }, 2200);

    try {
      const { data } = await api.post('/import/batch', { pgns, platform, username: username.trim() });
      clearInterval(interval);
      setResult(data);
      setStep(5);
      localStorage.removeItem('needs_onboarding');
    } catch (err) {
      clearInterval(interval);
      toast.error(err.response?.data?.error || 'Erro ao analisar partidas');
      setStep(3);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(124,106,247,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 48 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} style={{ width: s === step ? 28 : 8, height: 8, borderRadius: 4, background: s <= step ? '#7C6AF7' : '#1E1E32', transition: 'all 0.3s ease' }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ textAlign: 'center', maxWidth: 540 }}>
            <div style={{ width: 64, height: 64, background: 'rgba(124,106,247,0.15)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>♟</div>
            <h1 style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 36, color: '#EFEFEF', marginBottom: 12, lineHeight: 1.2 }}>
              Bem-vindo ao <span style={{ background: 'linear-gradient(135deg, #7C6AF7, #00E5A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Elo Arc</span>
            </h1>
            <p style={{ color: '#7A7A9A', fontSize: 16, fontFamily: 'Inter', lineHeight: 1.7, marginBottom: 40 }}>
              Vamos montar seu perfil de jogador analisando suas partidas reais. O processo leva menos de 2 minutos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
                Importar minhas partidas
              </button>
              <button onClick={skip} style={{ background: 'none', border: 'none', color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', cursor: 'pointer', padding: 8 }}>
                Prefiro colar um PGN manualmente →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Choose platform */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ maxWidth: 480, width: '100%' }}>
            <h2 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 26, color: '#EFEFEF', marginBottom: 8, textAlign: 'center' }}>Onde você joga?</h2>
            <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', marginBottom: 32 }}>Escolha a plataforma para importar suas últimas partidas</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { id: 'lichess', name: 'Lichess', color: '#EFEFEF', icon: '♞', desc: 'lichess.org' },
                { id: 'chesscom', name: 'Chess.com', color: '#81B64C', icon: '♟', desc: 'chess.com' },
              ].map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)}
                  style={{ padding: '24px 20px', borderRadius: 16, border: `2px solid ${platform === p.id ? '#7C6AF7' : '#1E1E32'}`, background: platform === p.id ? 'rgba(124,106,247,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 36 }}>{p.icon}</span>
                  <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 16, color: '#EFEFEF' }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>{p.desc}</span>
                </button>
              ))}
            </div>

            {platform && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 8, fontFamily: 'Inter' }}>
                  Seu username no {platform === 'lichess' ? 'Lichess' : 'Chess.com'}
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={username} onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && username.trim() && preview()}
                    placeholder={`ex: magnus_carlsen`}
                    className="input-field" style={{ flex: 1 }} />
                  <button onClick={preview} disabled={loading || !username.trim()} className="btn-primary" style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
                    {loading ? '...' : 'Buscar'}
                  </button>
                </div>
              </motion.div>
            )}

            <button onClick={() => setStep(1)} style={{ marginTop: 20, background: 'none', border: 'none', color: '#7A7A9A', fontSize: 13, fontFamily: 'Inter', cursor: 'pointer' }}>← Voltar</button>
          </motion.div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: 'rgba(0,229,160,0.1)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>✓</div>
            <h2 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 26, color: '#EFEFEF', marginBottom: 8 }}>
              {pgns.length} partidas encontradas
            </h2>
            <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', marginBottom: 8 }}>
              Conta: <strong style={{ color: '#EFEFEF' }}>{username}</strong> no {platform === 'lichess' ? 'Lichess' : 'Chess.com'}
            </p>
            <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', lineHeight: 1.6, marginBottom: 32 }}>
              Vamos analisar até 10 partidas com IA para montar seu perfil completo e plano de treino de 30 dias.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={importAndAnalyze} className="btn-primary" style={{ fontSize: 15, padding: '14px' }}>
                Analisar e montar meu perfil
              </button>
              <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: '#7A7A9A', fontSize: 13, fontFamily: 'Inter', cursor: 'pointer', padding: 8 }}>
                ← Tentar outro username
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Loading */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 32px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid rgba(124,106,247,0.2)', borderTopColor: '#7C6AF7', animation: 'spin 1s linear infinite' }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={msgIndex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 18, color: '#EFEFEF', marginBottom: 8 }}>
                {LOADING_MESSAGES[msgIndex]}
              </motion.p>
            </AnimatePresence>
            <p style={{ color: '#7A7A9A', fontSize: 13, fontFamily: 'Inter' }}>Isso pode levar 30–60 segundos</p>
          </motion.div>
        )}

        {/* Step 5: Success */}
        {step === 5 && result && (
          <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
              style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #7C6AF7, #00E5A0)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>
              ✓
            </motion.div>
            <h2 style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 28, color: '#EFEFEF', marginBottom: 8 }}>
              Perfil montado!
            </h2>
            <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', marginBottom: 24 }}>
              Analisamos <strong style={{ color: '#EFEFEF' }}>{result.games_analyzed} partidas</strong> suas e montamos seu perfil inicial.
            </p>

            {result.diagnostico && (
              <div style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 12, color: '#7C6AF7', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Inter', marginBottom: 8 }}>Seu diagnóstico</div>
                <p style={{ color: '#EFEFEF', fontSize: 13, fontFamily: 'Inter', lineHeight: 1.7, margin: 0 }}>
                  {result.diagnostico.slice(0, 280)}{result.diagnostico.length > 280 ? '...' : ''}
                </p>
              </div>
            )}

            {result.perfil && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
                {[
                  { label: 'Tática', val: result.perfil.tatica },
                  { label: 'Posicional', val: result.perfil.posicional },
                  { label: 'Final', val: result.perfil.final },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 8px', border: '1px solid #1E1E32' }}>
                    <div style={{ fontSize: 22, fontFamily: 'Sora', fontWeight: 700, color: '#7C6AF7', marginBottom: 2 }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ width: '100%', fontSize: 16, padding: '14px' }}>
              Ir para o Dashboard →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
