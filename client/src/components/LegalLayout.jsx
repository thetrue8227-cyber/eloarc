import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from './Navbar';
import Footer from './Footer';

export default function LegalLayout({ titleKey, introKey, sectionsKey, sectionOrder }) {
  const { t } = useTranslation();

  return (
    <div style={{ background: '#080810', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 120, paddingBottom: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}
        >
          <h1
            style={{
              fontFamily: 'Sora',
              fontWeight: 800,
              fontSize: 'clamp(32px,5vw,48px)',
              marginBottom: 12,
              color: '#EFEFEF',
            }}
          >
            {t(titleKey)}
          </h1>
          <p style={{ color: '#7A7A9A', fontSize: 15, fontFamily: 'Inter', lineHeight: 1.7, marginBottom: 12 }}>
            {t(introKey)}
          </p>
          <p style={{ color: '#5A5A7A', fontSize: 12, fontFamily: 'Inter', marginBottom: 48 }}>
            {t('legal.last_updated')}: 2026-05-06
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {sectionOrder.map((id) => (
              <section key={id}>
                <h2
                  style={{
                    fontFamily: 'Sora',
                    fontWeight: 700,
                    fontSize: 20,
                    color: '#EFEFEF',
                    marginBottom: 10,
                  }}
                >
                  {t(`${sectionsKey}.${id}_title`)}
                </h2>
                <p
                  style={{
                    color: '#B0B0C0',
                    fontSize: 14,
                    fontFamily: 'Inter',
                    lineHeight: 1.75,
                    margin: 0,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {t(`${sectionsKey}.${id}_body`)}
                </p>
              </section>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
