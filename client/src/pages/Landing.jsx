import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowRight, Zap, Brain, TrendingUp, Check, X } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { show: { transition: { staggerChildren: 0.12 } } };

const ChessBoardAnim = () => (
  <div style={{ position: 'relative', width: 340, height: 340 }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', width: 320, height: 320, borderRadius: 10, overflow: 'hidden', border: '1px solid #1E1E32' }}>
      {Array.from({ length: 64 }, (_, i) => {
        const row = Math.floor(i / 8), col = i % 8;
        const light = (row + col) % 2 === 0;
        return <div key={i} style={{ background: light ? '#1E1E32' : '#080810' }} />;
      })}
    </div>
    {[
      { x: 40, y: 40, color: '#7C6AF7', delay: 0 },
      { x: 160, y: 120, color: '#00E5A0', delay: 0.5 },
      { x: 240, y: 200, color: '#7C6AF7', delay: 1 },
      { x: 80, y: 240, color: '#00E5A0', delay: 1.5 },
    ].map((dot, i) => (
      <motion.div key={i}
        style={{ position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: dot.color, top: dot.y, left: dot.x, boxShadow: `0 0 12px ${dot.color}` }}
        animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
        transition={{ repeat: Infinity, duration: 2, delay: dot.delay }}
      />
    ))}
    {[
      { x1: 40, y1: 40, x2: 160, y2: 120 },
      { x1: 160, y1: 120, x2: 240, y2: 200 },
      { x1: 80, y1: 240, x2: 160, y2: 120 },
    ].map((line, i) => (
      <svg key={i} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <motion.line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
          stroke="url(#lg)" strokeWidth="1.5" strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity, repeatType: 'loop', repeatDelay: 2 }}
        />
        <defs>
          <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C6AF7"/>
            <stop offset="100%" stopColor="#00E5A0"/>
          </linearGradient>
        </defs>
      </svg>
    ))}
  </div>
);

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    { icon: ArrowRight, title: t('how_it_works.step1_title'), desc: t('how_it_works.step1_desc') },
    { icon: Brain, title: t('how_it_works.step2_title'), desc: t('how_it_works.step2_desc') },
    { icon: TrendingUp, title: t('how_it_works.step3_title'), desc: t('how_it_works.step3_desc') },
  ];

  const testimonials = [
    { name: t('testimonials.t1_name'), role: t('testimonials.t1_role'), text: t('testimonials.t1_text') },
    { name: t('testimonials.t2_name'), role: t('testimonials.t2_role'), text: t('testimonials.t2_text') },
    { name: t('testimonials.t3_name'), role: t('testimonials.t3_role'), text: t('testimonials.t3_text') },
  ];

  const comparison = [
    { feature: t('comparison.coaching_continuous'), elo: true, chess: false, lichess: false },
    { feature: t('comparison.evolving_profile'), elo: true, chess: false, lichess: false },
    { feature: t('comparison.personalized_plan'), elo: true, chess: true, lichess: false },
    { feature: t('comparison.ai_coach'), elo: true, chess: true, lichess: false },
  ];

  return (
    <div style={{ background: '#080810', minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Animated gradient background orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '5%', left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,247,0.1) 0%, transparent 70%)' }} />
          <motion.div animate={{ x: [0, -50, 0], y: [0, 40, 0] }} transition={{ duration: 22, repeat: Infinity, ease: 'linear', delay: 3 }}
            style={{ position: 'absolute', top: '10%', right: '15%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,160,0.07) 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-5xl mx-auto px-6" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}
              style={{ display: 'inline-block', background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24, fontSize: 13, color: '#7C6AF7', fontFamily: 'Inter' }}>
              ✦ {t('hero.badge')}
            </motion.div>
            <motion.h1 variants={fadeUp}
              style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 'clamp(48px,7vw,72px)', lineHeight: 1.1, marginBottom: 24 }}
              className="gradient-text">
              {t('hero.tagline')}
            </motion.h1>
            <motion.p variants={fadeUp}
              style={{ fontSize: 18, color: '#7A7A9A', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7, fontFamily: 'Inter' }}>
              {t('hero.subtitle')}
            </motion.p>
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} className="btn-primary" style={{ fontSize: 16, padding: '14px 32px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {t('hero.cta_primary')} <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate('/pricing')} className="btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
                {t('hero.cta_secondary')}
              </button>
            </motion.div>
          </motion.div>

          {/* 3D Dashboard Mockup */}
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}
            style={{ marginTop: 72, display: 'flex', justifyContent: 'center' }}>
            <div style={{ transform: 'perspective(1200px) rotateX(6deg)', transformOrigin: 'top center', width: '100%', maxWidth: 780, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(124,106,247,0.25)', boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,106,247,0.12)' }}>
              {/* Fake browser chrome */}
              <div style={{ background: '#0E0E1A', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #1E1E32' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
                <div style={{ flex: 1, background: '#1E1E32', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter', marginLeft: 12 }}>{t('landing.fake_url')}</div>
              </div>
              {/* Fake dashboard */}
              <div style={{ background: '#080810', padding: 20, display: 'flex', gap: 16, minHeight: 280 }}>
                {/* Sidebar */}
                <div style={{ width: 48, background: '#0E0E1A', borderRadius: 10, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...Array(6)].map((_, i) => <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: i === 0 ? 'rgba(124,106,247,0.25)' : 'rgba(255,255,255,0.04)' }} />)}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {[['#7C6AF7','47'], ['#FF6B6B', t('analyze.category_tactics')], ['#00E5A0','1240'], ['#FFD700','Knight']].map(([color, val], i) => (
                      <div key={i} style={{ background: '#0E0E1A', borderRadius: 10, padding: '10px 12px', border: '1px solid #1E1E32' }}>
                        <div style={{ width: 20, height: 4, borderRadius: 2, background: color, marginBottom: 8, opacity: 0.7 }} />
                        <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: '#EFEFEF' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Chart area */}
                  <div style={{ background: '#0E0E1A', borderRadius: 10, padding: '12px 16px', border: '1px solid #1E1E32', flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#7A7A9A', fontFamily: 'Inter', marginBottom: 10 }}>{t('landing.fake_phase_evolution')}</div>
                    <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="hg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C6AF7" stopOpacity="0.4"/><stop offset="100%" stopColor="#7C6AF7" stopOpacity="0"/></linearGradient>
                        <linearGradient id="hg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00E5A0" stopOpacity="0.3"/><stop offset="100%" stopColor="#00E5A0" stopOpacity="0"/></linearGradient>
                      </defs>
                      <path d="M0 60 C60 50 100 30 160 35 S260 20 320 25 S380 15 400 18 L400 80 L0 80 Z" fill="url(#hg1)" />
                      <path d="M0 60 C60 50 100 30 160 35 S260 20 320 25 S380 15 400 18" fill="none" stroke="#7C6AF7" strokeWidth="2" />
                      <path d="M0 70 C80 60 130 45 190 50 S290 38 340 40 S390 32 400 30 L400 80 L0 80 Z" fill="url(#hg2)" />
                      <path d="M0 70 C80 60 130 45 190 50 S290 38 340 40 S390 32 400 30" fill="none" stroke="#00E5A0" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="features" style={{ padding: '80px 24px', background: 'rgba(16,16,30,0.5)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ textAlign: 'center', fontFamily: 'Sora', fontWeight: 700, fontSize: 36, marginBottom: 56 }}>
            {t('how_it_works.title')}
          </motion.h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card" style={{ padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,106,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <s.icon size={24} color="#7C6AF7" />
                </div>
                <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 18, marginBottom: 10, color: '#EFEFEF' }}>{`${i + 1}. ${s.title}`}</div>
                <p style={{ color: '#7A7A9A', fontSize: 14, lineHeight: 1.6, fontFamily: 'Inter', margin: 0 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ padding: '80px 24px' }}>
        <div className="max-w-3xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ textAlign: 'center', fontFamily: 'Sora', fontWeight: 700, fontSize: 36, marginBottom: 40 }}>
            {t('comparison.title')}
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E1E32' }}>
                  {[t('comparison.feature'), 'Elo Arc', 'Chess.com', 'Lichess'].map((h, i) => (
                    <th key={i} style={{ padding: '16px 20px', textAlign: i === 0 ? 'left' : 'center', fontSize: 13, fontWeight: 600, color: i === 1 ? '#7C6AF7' : '#7A7A9A', fontFamily: 'Inter' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < comparison.length - 1 ? '1px solid #1E1E32' : 'none' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#EFEFEF' }}>{row.feature}</td>
                    {[row.elo, row.chess, row.lichess].map((v, j) => (
                      <td key={j} style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {v ? <Check size={16} color="#00E5A0" style={{ margin: 'auto' }} /> : <X size={16} color="#FF4D4F" style={{ margin: 'auto' }} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 24px', background: 'rgba(16,16,30,0.5)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ textAlign: 'center', fontFamily: 'Sora', fontWeight: 700, fontSize: 36, marginBottom: 48 }}>
            {t('testimonials.title')}
          </motion.h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {testimonials.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card" style={{ padding: '24px', boxShadow: '0 0 24px rgba(124,106,247,0.1)' }}>
                <p style={{ fontSize: 14, color: '#EFEFEF', lineHeight: 1.7, fontFamily: 'Inter', marginBottom: 16 }}>"{t.text}"</p>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#7C6AF7' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>{t.role}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 'clamp(32px,5vw,56px)', marginBottom: 20 }} className="gradient-text">
            {t('landing.cta_title')}
          </h2>
          <p style={{ color: '#7A7A9A', fontSize: 16, marginBottom: 32, fontFamily: 'Inter' }}>{t('landing.cta_subtitle')}</p>
          <button onClick={() => navigate('/register')} className="btn-primary" style={{ fontSize: 16, padding: '16px 40px' }}>
            {t('hero.cta_primary')} <ArrowRight size={18} />
          </button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
