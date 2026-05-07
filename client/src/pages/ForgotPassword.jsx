import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import i18n from '../i18n';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email, language: i18n.language });
      setSent(true);
    } catch (err) {
      const code = err.response?.data?.error;
      const key = code ? `errors.${code}` : 'errors.generic';
      const translated = t(key);
      toast.error(translated === key ? t('errors.generic') : translated);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', marginBottom: 32, textDecoration: 'none' }}>
            <Logo height={40} />
          </Link>
          <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 26, color: '#EFEFEF', marginBottom: 8 }}>{t('auth.reset_title')}</h1>
          <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>{t('auth.reset_subtitle')}</p>
        </div>
        <div className="card" style={{ padding: 32 }}>
          {sent ? (
            <p style={{ color: '#00E5A0', textAlign: 'center', fontFamily: 'Inter', lineHeight: 1.6 }}>{t('auth.reset_sent')}</p>
          ) : (
            <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder={t('auth.email')} required />
              <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: 15, padding: 13 }}>
                {loading ? '...' : t('auth.reset_password')}
              </button>
            </form>
          )}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/login" style={{ fontSize: 13, color: '#7A7A9A', textDecoration: 'none' }}>← {t('auth.back_to_login')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
