import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
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
      key: 'free', title: t('pricing.free_title'), price: 0, cta: t('pricing.cta_free'),
      features: [
        '3 ' + (t('overview.games_analyzed').toLowerCase()) + '/month',
        'Engine up to ELO 1200',
        'Basic player profile',
        'Generic training plan',
      ],
    },
    {
      key: 'rising', title: t('pricing.rising_title'), price: 10, cta: t('pricing.cta_rising'),
      highlighted: true, badge: t('pricing.most_popular'),
      features: [
        'Unlimited analyses',
        'Engine up to ELO 2200',
        'Full player history',
        'Auto-updated training plan',
        'AI move-by-move replay',
        'AI coach chat (20/month)',
        'Biweekly email report',
        'PT-BR & EN',
      ],
    },
    {
      key: 'elite', title: t('pricing.elite_title'), price: 30, cta: t('pricing.cta_elite'),
      features: [
        'Everything in Rising',
        'Engine ELO 2800+',
        'Unlimited AI coach chat',
        'Weekly email report',
        'GM game comparison',
        'Opening repertoire analysis',
      ],
    },
    {
      key: 'arc_master', title: t('pricing.arc_master_title'), price: 100, cta: t('pricing.cta_arc_master'),
      features: [
        'Everything in Elite',
        'Full repertoire analysis',
        '30-day detailed training plan',
        'Monthly deep report (PDF)',
        'Exclusive profile badge',
        'Early access to new features',
      ],
    },
  ];

  return (
    <div style={{ background: '#080810', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 64 }}>
          <h1 style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: 'clamp(36px,5vw,56px)', marginBottom: 12 }} className="gradient-text">
            {t('pricing.title')}
          </h1>
          <p style={{ color: '#7A7A9A', fontSize: 16, fontFamily: 'Inter' }}>{t('pricing.subtitle')}</p>
        </motion.div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 1200, margin: '0 auto', alignItems: 'stretch' }}>
          {plans.map((plan, i) => (
            <motion.div key={plan.key} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{ flex: '1 1 220px', maxWidth: 300, display: 'flex' }}>
              <PricingCard {...plan} onSelect={() => handleSelect(plan.key)} />
            </motion.div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#7A7A9A', fontSize: 13, marginTop: 40, fontFamily: 'Inter' }}>
          All plans include 14-day money-back guarantee · Cancel anytime · Secure payments via Stripe
        </p>
      </div>
    </div>
  );
}
