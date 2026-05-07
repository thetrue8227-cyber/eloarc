import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import i18n from '../i18n';

export default function Navbar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleLang = () => {
    const next = i18n.language === 'pt-BR' ? 'en' : 'pt-BR';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <nav style={{ borderBottom: '1px solid #1E1E32', backdropFilter: 'blur(12px)', background: 'rgba(8,8,16,0.8)' }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Logo height={36} />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" style={{ color: '#7A7A9A', fontSize: '14px', textDecoration: 'none' }}
            className="hover:text-white transition-colors">{t('nav.features')}</a>
          <Link to="/pricing" style={{ color: '#7A7A9A', fontSize: '14px', textDecoration: 'none' }}
            className="hover:text-white transition-colors">{t('nav.pricing')}</Link>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleLang}
            style={{ background: 'transparent', border: '1px solid #1E1E32', borderRadius: '8px', padding: '6px 12px', color: '#7A7A9A', fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter' }}
            className="hover:border-primary transition-colors">
            {i18n.language === 'pt-BR' ? 'PT' : 'EN'} | {i18n.language === 'pt-BR' ? 'EN' : 'PT'}
          </button>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px' }}>
              {t('nav.dashboard')}
            </button>
          ) : (
            <>
              <Link to="/login" style={{ color: '#EFEFEF', textDecoration: 'none', fontSize: '14px', padding: '8px 16px' }}>{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '8px 20px', fontSize: '14px', textDecoration: 'none' }}>
                {t('nav.start_free')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
