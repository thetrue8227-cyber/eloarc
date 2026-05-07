import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';
import i18n from '../i18n';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error(t('errors.password_too_short')); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, i18n.language);
      localStorage.setItem('needs_onboarding', '1');
      navigate('/onboarding');
    } catch (err) {
      const code = err.response?.data?.error;
      const key = code ? `errors.${code}` : 'errors.generic';
      const translated = t(key);
      toast.error(translated === key ? t('errors.generic') : translated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', marginBottom: 32, textDecoration: 'none' }}>
            <Logo height={40} />
          </Link>
          <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, color: '#EFEFEF', marginBottom: 8 }}>{t('auth.register')}</h1>
          <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>{t('auth.has_account')} <Link to="/login" style={{ color: '#7C6AF7', textDecoration: 'none' }}>{t('auth.login')}</Link></p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>{t('auth.name')}</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-field" placeholder="Magnus Carlsen" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>{t('auth.email')}</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>{t('auth.password')}</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field" placeholder="8+ characters" required minLength={8} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8, fontSize: 15, padding: '13px' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('auth.submit_register')}
            </button>
          </form>
          <p style={{ fontSize: 11, color: '#7A7A9A', textAlign: 'center', marginTop: 16, fontFamily: 'Inter' }}>
            {t('auth.agree_terms')} <Link to="/terms" style={{ color: '#7C6AF7', textDecoration: 'none' }}>{t('auth.terms_link')}</Link> {t('auth.agree_terms_and')} <Link to="/privacy" style={{ color: '#7C6AF7', textDecoration: 'none' }}>{t('auth.privacy_link')}</Link>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
