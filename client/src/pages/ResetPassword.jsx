import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), password });
      toast.success('Password updated!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-block', fontFamily: 'Sora', fontWeight: 700, fontSize: 20, background: 'linear-gradient(135deg,#7C6AF7,#00E5A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textDecoration: 'none', marginBottom: 32 }}>Elo Arc</Link>
          <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 26, color: '#EFEFEF', marginBottom: 8 }}>New password</h1>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="New password (8+ chars)" required minLength={8} />
            <button type="submit" className="btn-primary" disabled={loading} style={{ fontSize: 15, padding: 13 }}>
              {loading ? '...' : 'Update password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
