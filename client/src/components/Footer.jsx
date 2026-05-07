import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Twitter, Instagram, Youtube } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: '1px solid #1E1E32', background: '#080810', padding: '48px 24px 24px', color: '#7A7A9A', fontFamily: 'Inter' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 40, marginBottom: 36 }}>
          {/* Brand */}
          <div>
            <Logo height={32} />
            <p style={{ fontSize: 13, color: '#7A7A9A', marginTop: 12, lineHeight: 1.6 }}>{t('footer.tagline')}</p>
          </div>

          {/* Product */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#EFEFEF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              {t('footer.section_product')}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><a href="/#features" style={linkStyle}>{t('footer.features')}</a></li>
              <li><Link to="/pricing" style={linkStyle}>{t('footer.pricing')}</Link></li>
              <li><span style={{ ...linkStyle, opacity: 0.5, cursor: 'not-allowed' }}>{t('footer.blog')}</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#EFEFEF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              {t('footer.section_legal')}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><Link to="/terms" style={linkStyle}>{t('footer.terms')}</Link></li>
              <li><Link to="/privacy" style={linkStyle}>{t('footer.privacy')}</Link></li>
              <li><Link to="/cookies" style={linkStyle}>{t('footer.cookies')}</Link></li>
              <li><Link to="/refund" style={linkStyle}>{t('footer.refund')}</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#EFEFEF', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              {t('footer.section_social')}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="#" aria-label="Twitter" style={iconStyle}><Twitter size={16} /></a>
              <a href="#" aria-label="Instagram" style={iconStyle}><Instagram size={16} /></a>
              <a href="#" aria-label="YouTube" style={iconStyle}><Youtube size={16} /></a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E1E32', paddingTop: 18, fontSize: 12, color: '#7A7A9A', textAlign: 'center' }}>
          © {year} Elo Arc. {t('footer.rights')}.
        </div>
      </div>
    </footer>
  );
}

const linkStyle = {
  color: '#7A7A9A',
  fontSize: 13,
  textDecoration: 'none',
  transition: 'color 0.15s',
};

const iconStyle = {
  width: 34,
  height: 34,
  borderRadius: 8,
  border: '1px solid #1E1E32',
  background: 'rgba(255,255,255,0.02)',
  color: '#7A7A9A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  transition: 'all 0.15s',
};
