import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error(t('auth.passwords_dont_match')); return; }
    if (password.length < 8) { toast.error(t('errors.password_too_short')); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), password });
      toast.success(t('auth.password_updated'));
      navigate('/login');
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
          <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 26, color: '#EFEFEF', marginBottom: 8 }}>{t('auth.new_password_title')}</h1>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder={t('auth.new_password_placeholder')} required minLength={8} />
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className="input-field" placeholder={t('auth.confirm_password_placeholder')} required minLength={8} />
            <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: 15, padding: 13, marginTop: 4 }}>
              {loading ? '...' : t('auth.update_password')}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/login" style={{ fontSize: 13, color: '#7A7A9A', textDecoration: 'none' }}>← {t('auth.back_to_login')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
