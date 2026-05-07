import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'cookie_consent';

export default function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = (kind) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ kind, ts: Date.now() }));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 100,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              maxWidth: 720,
              width: '100%',
              background: '#10101E',
              border: '1px solid #1E1E32',
              borderRadius: 14,
              padding: '18px 22px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 14,
              fontFamily: 'Inter',
            }}
          >
            <p style={{ flex: '1 1 280px', fontSize: 13, color: '#B0B0C0', margin: 0, lineHeight: 1.6 }}>
              {t('cookies.banner.message')}{' '}
              <Link to="/cookies" style={{ color: '#7C6AF7', textDecoration: 'none' }}>
                {t('cookies.banner.policy_link')}
              </Link>
              .
            </p>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => accept('essential')}
                className="btn-secondary"
                style={{ fontSize: 12, padding: '8px 14px' }}
              >
                {t('cookies.banner.accept_essential')}
              </button>
              <button
                onClick={() => accept('all')}
                className="btn-primary"
                style={{ fontSize: 12, padding: '8px 14px' }}
              >
                {t('cookies.banner.accept_all')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
