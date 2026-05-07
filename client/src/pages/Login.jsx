import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
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
          <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, color: '#EFEFEF', marginBottom: 8 }}>{t('auth.login')}</h1>
          <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>{t('auth.no_account')} <Link to="/register" style={{ color: '#7C6AF7', textDecoration: 'none' }}>{t('auth.register')}</Link></p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>{t('auth.email')}</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>{t('auth.password')}</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field" placeholder="••••••••" required />
            </div>
            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: '#7A7A9A', textDecoration: 'none' }}
                className="hover:text-primary">{t('auth.forgot_password')}</Link>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8, fontSize: 15, padding: '13px' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('auth.submit_login')}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
