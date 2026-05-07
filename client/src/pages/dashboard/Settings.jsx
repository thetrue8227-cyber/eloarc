import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Check, ExternalLink, FileText, RefreshCw } from 'lucide-react';
import i18n from '../../i18n';

import { PLAN_LABELS_FULL as PLAN_LABELS, PLAN_COLORS } from '../../utils/planLimits';

export default function Settings() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    language: user?.language || 'pt-BR',
    lichess_username: user?.lichess_username || '',
    chesscom_username: user?.chesscom_username || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        language: form.language,
        lichess_username: form.lichess_username || null,
        chesscom_username: form.chesscom_username || null,
      };
      const { data } = await api.patch('/auth/me', payload);
      updateUser(data.user);
      i18n.changeLanguage(form.language);
      localStorage.setItem('lang', form.language);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error(t('errors.generic')); }
    finally { setSaving(false); }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/import/sync');
      toast.success(t('settings.sync_complete', { count: data.new_games }));
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.sync_error'));
    } finally { setSyncing(false); }
  };

  const manageSubscription = async () => {
    try {
      const { data } = await api.post('/stripe/portal');
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || t('errors.generic'));
    }
  };

  const generatePDF = async () => {
    setGeneratingPDF(true);
    try {
      const response = await api.post('/pdf/monthly-report', {}, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `elo-arc-report-${new Date().toISOString().slice(0, 7)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('settings.pdf_generated'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.pdf_failed'));
    } finally { setGeneratingPDF(false); }
  };

  const hasPlatforms = form.lichess_username || form.chesscom_username;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, marginBottom: 8, color: '#EFEFEF' }}>{t('settings.title')}</h1>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
        {/* Account */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, color: '#EFEFEF', marginBottom: 20 }}>{t('settings.account')}</h3>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>{t('settings.name')}</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>{t('settings.email')}</label>
              <input type="email" value={user?.email || ''} disabled
                className="input-field" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>{t('settings.language')}</label>
              <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
                className="input-field" style={{ cursor: 'pointer' }}>
                <option value="pt-BR">Português (BR)</option>
                <option value="en">English</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', fontSize: 14, padding: '10px 24px' }}>
              {saved ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={15} />{t('settings.saved')}</span> : saving ? '...' : t('settings.save')}
            </button>
          </form>
        </motion.div>

        {/* Chess platforms */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.13 }} className="card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, color: '#EFEFEF', marginBottom: 6 }}>{t('settings.platforms_title')}</h3>
          <p style={{ fontSize: 13, color: '#7A7A9A', fontFamily: 'Inter', marginBottom: 20 }}>{t('settings.platforms_subtitle')}</p>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>
                <span style={{ fontWeight: 600, color: '#EFEFEF' }}>♞</span> {t('settings.lichess_username')}
              </label>
              <input type="text" value={form.lichess_username} onChange={e => setForm(p => ({ ...p, lichess_username: e.target.value }))}
                placeholder="your-username" className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#7A7A9A', marginBottom: 6, fontFamily: 'Inter' }}>
                <span style={{ fontWeight: 600, color: '#81B64C' }}>♟</span> {t('settings.chesscom_username')}
              </label>
              <input type="text" value={form.chesscom_username} onChange={e => setForm(p => ({ ...p, chesscom_username: e.target.value }))}
                placeholder="your-username" className="input-field" />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ fontSize: 13, padding: '9px 20px' }}>
                {saved ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} /> {t('settings.saved_short')}</span> : saving ? '...' : t('settings.save_usernames')}
              </button>
              {hasPlatforms && (
                <button type="button" onClick={sync} disabled={syncing} className="btn-secondary" style={{ fontSize: 13, padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                  {syncing ? t('settings.syncing') : t('settings.sync_new_games')}
                </button>
              )}
            </div>
            {user?.last_sync_at && (
              <div style={{ fontSize: 12, color: '#7A7A9A', fontFamily: 'Inter' }}>
                {t('settings.last_sync')}: {new Date(user.last_sync_at).toLocaleString(user?.language === 'en' ? 'en-US' : 'pt-BR')}
              </div>
            )}
          </form>
        </motion.div>

        {/* Subscription */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }} className="card" style={{ padding: 28 }}>
          <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, color: '#EFEFEF', marginBottom: 16 }}>{t('settings.subscription')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: '#7A7A9A', fontFamily: 'Inter', marginBottom: 4 }}>{t('settings.plan')}</div>
              <div style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 18, color: PLAN_COLORS[user?.plan] || '#7A7A9A' }}>
                {PLAN_LABELS[user?.plan] || 'Free'}
              </div>
            </div>
            {user?.plan !== 'free' && (
              <button onClick={manageSubscription} className="btn-secondary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}>
                <ExternalLink size={13} /> {t('settings.manage_subscription')}
              </button>
            )}
          </div>
          {user?.plan === 'free' && (
            <a href="/pricing" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontSize: 14, padding: '10px 24px' }}>
              {t('settings.upgrade')}
            </a>
          )}
        </motion.div>

        {/* King PDF */}
        {user?.plan === 'king' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.25)', borderRadius: 16, padding: 28 }}>
            <h3 style={{ fontFamily: 'Sora', fontWeight: 600, fontSize: 16, color: '#EFEFEF', marginBottom: 8 }}>{t('settings.monthly_pdf_title')}</h3>
            <p style={{ color: '#7A7A9A', fontSize: 13, fontFamily: 'Inter', lineHeight: 1.6, marginBottom: 20 }}>
              {t('settings.monthly_pdf_desc')}
            </p>
            <button onClick={generatePDF} disabled={generatingPDF} className="btn-primary" style={{ fontSize: 14, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={15} />
              {generatingPDF ? t('settings.generating_pdf') : t('settings.generate_pdf')}
            </button>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
