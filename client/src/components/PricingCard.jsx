import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function PricingCard({ title, price, features, cta, highlighted, onSelect, badge }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      style={{
        background: '#10101E',
        borderRadius: 16,
        padding: '32px 28px',
        position: 'relative',
        border: highlighted ? 'none' : '1px solid #1E1E32',
        flex: '1 1 0',
        minWidth: 240,
        maxWidth: 320,
        boxShadow: highlighted ? '0 0 32px rgba(124,106,247,0.25)' : 'none',
      }}>
      {highlighted && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 17,
          background: 'linear-gradient(135deg, #7C6AF7, #00E5A0)',
          zIndex: -1,
        }} />
      )}
      {badge && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #7C6AF7, #00E5A0)',
          color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 14px',
          borderRadius: 20, whiteSpace: 'nowrap', fontFamily: 'Inter',
        }}>
          {badge}
        </div>
      )}

      <div style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 700, color: '#EFEFEF', marginBottom: 8 }}>{title}</div>
      <div style={{ marginBottom: 24 }}>
        {price === 0 ? (
          <span style={{ fontFamily: 'Sora', fontSize: 36, fontWeight: 800, color: '#EFEFEF' }}>Free</span>
        ) : (
          <>
            <span style={{ fontFamily: 'Sora', fontSize: 36, fontWeight: 800, color: '#EFEFEF' }}>${price}</span>
            <span style={{ color: '#7A7A9A', fontSize: 14, fontFamily: 'Inter' }}>/mo</span>
          </>
        )}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#EFEFEF', fontFamily: 'Inter' }}>
            <Check size={15} style={{ color: '#00E5A0', flexShrink: 0, marginTop: 1 }} />
            {f}
          </li>
        ))}
      </ul>

      <button onClick={onSelect}
        className={highlighted ? 'btn-primary' : 'btn-secondary'}
        style={{ width: '100%', fontSize: 14 }}>
        {cta}
      </button>
    </motion.div>
  );
}
