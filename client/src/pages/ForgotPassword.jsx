import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error(t('errors.generic')); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-block', fontFamily: 'Sora', fontWeight: 700, fontSize: 20, background: 'linear-gradient(135deg,#7C6AF7,#00E5A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none', marginBottom: 32 }}>Elo Arc</Link>
          <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 26, color: '#EFEFEF', marginBottom: 8 }}>{t('auth.forgot_password')}</h1>
        </div>
        <div className="card" style={{ padding: 32 }}>
          {sent ? (
            <p style={{ color: '#00E5A0', textAlign: 'center', fontFamily: 'Inter', lineHeight: 1.6 }}>{t('auth.reset_sent')}</p>
          ) : (
            <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" required />
              <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: 15, padding: 13 }}>
                {loading ? '...' : t('auth.reset_password')}
              </button>
            </form>
          )}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/login" style={{ fontSize: 13, color: '#7A7A9A', textDecoration: 'none' }}>← {t('auth.login')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
