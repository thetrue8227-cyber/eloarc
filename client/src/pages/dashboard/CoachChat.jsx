import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Send, Trash2, MessageSquare } from 'lucide-react';

export default function CoachChat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const canChat = ['knight', 'king'].includes(user?.plan);

  useEffect(() => {
    if (!canChat) { setLoading(false); return; }
    api.get('/chat/messages')
      .then(r => setMessages(r.data.messages))
      .finally(() => setLoading(false));
  }, [canChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const { data } = await api.post('/chat/send', { message: msg });
      setMessages(prev => [...prev, data.message]);
    } catch (err) {
      const code = err.response?.data?.error;
      if (code === 'chat_limit_reached') toast.error(t('chat.limit_warning'));
      else toast.error(t('errors.generic'));
      setMessages(prev => prev.slice(0, -1));
      setInput(msg);
    } finally { setSending(false); }
  };

  const clearChat = async () => {
    if (!window.confirm(t('chat.clear_confirm'))) return;
    await api.delete('/chat/messages');
    setMessages([]);
  };

  if (!canChat) {
    return (
      <div>
        <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, marginBottom: 8, color: '#EFEFEF' }}>{t('chat.title')}</h1>
        <div className="card" style={{ padding: 48, textAlign: 'center', marginTop: 32 }}>
          <MessageSquare size={40} color="#7C6AF7" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', marginBottom: 20 }}>{t('chat.upgrade_prompt')}</p>
          <a href="/pricing" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '12px 24px' }}>
            {t('chat.view_plans')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 28, marginBottom: 4, color: '#EFEFEF' }}>{t('chat.title')}</h1>
          <p style={{ color: '#7A7A9A', fontSize: 13, fontFamily: 'Inter' }}>{t('chat.subtitle')}</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn-secondary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            <Trash2 size={13} /> {t('chat.clear')}
          </button>
        )}
      </motion.div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>
            {t('chat.loading')}
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(124,106,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={26} color="#7C6AF7" />
            </div>
            <p style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
              {t('chat.empty_prompt')}
            </p>
            {[t('chat.suggestion_endgames'), t('chat.suggestion_mistake'), t('chat.suggestion_opening')].map((q, i) => (
              <button key={i} onClick={() => setInput(q)}
                style={{ padding: '8px 16px', background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 20, fontSize: 13, color: '#EFEFEF', cursor: 'pointer', fontFamily: 'Inter' }}>
                {q}
              </button>
            ))}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '72%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #7C6AF7, #00E5A0)' : '#10101E',
                  border: msg.role === 'assistant' ? '1px solid #1E1E32' : 'none',
                  fontSize: 14, fontFamily: 'Inter', lineHeight: 1.65, color: '#EFEFEF', whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {sending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex' }}>
                <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: '#10101E', border: '1px solid #1E1E32' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C6AF7' }}
                        animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={t('chat.placeholder')}
          rows={1}
          style={{ flex: 1, background: '#10101E', border: '1px solid #1E1E32', borderRadius: 12, padding: '12px 16px', color: '#EFEFEF', fontFamily: 'Inter', fontSize: 14, resize: 'none', outline: 'none', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#7C6AF7'}
          onBlur={e => e.target.style.borderColor = '#1E1E32'}
        />
        <button onClick={send} disabled={sending || !input.trim()} className="btn-primary"
          style={{ width: 48, height: 48, borderRadius: 12, padding: 0, flexShrink: 0 }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
