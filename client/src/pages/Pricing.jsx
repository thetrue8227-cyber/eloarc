import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PricingCard from '../components/PricingCard';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Pricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelect = async (plan) => {
    if (plan === 'free') { navigate('/register'); return; }
    if (!user) { navigate('/register'); return; }
    try {
      const { data } = await api.post('/stripe/checkout', { plan });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || t('errors.generic'));
    }
  };

  const plans = [
    {
      key: 'free',
      title: t('pricing.free_title'),
      price: 0,
      cta: t('pricing.cta_free'),
      features: t('pricing.features.free', { returnObjects: true }),
    },
    {
      key: 'pawn',
      title: t('pricing.pawn_title'),
      price: 7,
      cta: t('pricing.cta_pawn'),
      features: t('pricing.features.pawn', { returnObjects: true }),
    },
    {
      key: 'knight',
      title: t('pricing.knight_title'),
      price: 19,
      cta: t('pricing.cta_knight'),
      highlighted: true,
      badge: t('pricing.most_popular'),
      features: t('pricing.features.knight', { returnObjects: true }),
    },
    {
      key: 'king',
      title: t('pricing.king_title'),
      price: 49,
      cta: t('pricing.cta_king'),
      features: t('pricing.features.king', { returnObjects: true }),
    },
  ];

  return (
    <div style={{ background: '#080810', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, flex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 'clamp(36px,5vw,56px)', marginBottom: 12 }} className="gradient-text">
            {t('pricing.title')}
          </h1>
          <p style={{ color: '#7A7A9A', fontSize: 16, fontFamily: 'Inter' }}>{t('pricing.subtitle')}</p>
        </motion.div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 1200, margin: '0 auto', alignItems: 'stretch' }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.key} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ flex: '1 1 220px', maxWidth: 280, display: 'flex' }}>
              <PricingCard {...plan} onSelect={() => handleSelect(plan.key)} />
            </motion.div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#7A7A9A', fontSize: 13, marginTop: 40, fontFamily: 'Inter' }}>
          {t('pricing.guarantee')}
        </p>
      </div>
      <Footer />
    </div>
  );
}
