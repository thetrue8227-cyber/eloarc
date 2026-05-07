import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { LayoutDashboard, Search, Cpu, User, BookOpen, History, MessageSquare, Settings, LogOut } from 'lucide-react';
import { PLAN_COLORS, PLAN_LABELS, PLAN_BG } from '../utils/planLimits';

const nav = [
  { key: 'overview',  to: '/dashboard',          icon: LayoutDashboard },
  { key: 'analyze',   to: '/dashboard/analyze',   icon: Search },
  { key: 'play',      to: '/dashboard/play',      icon: Cpu },
  { key: 'profile',   to: '/dashboard/profile',   icon: User },
  { key: 'training',  to: '/dashboard/training',  icon: BookOpen },
  { key: 'history',   to: '/dashboard/history',   icon: History },
  { key: 'coach',     to: '/dashboard/coach',     icon: MessageSquare },
  { key: 'settings',  to: '/dashboard/settings',  icon: Settings },
];

function Avatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C6AF7, #00E5A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#080810', fontFamily: 'Inter', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside style={{ width: 240, minHeight: '100vh', background: '#080810', borderRight: '1px solid #1E1E32', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40 }}>
      {/* Logo */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #1E1E32' }}>
        <Logo height={32} />
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {nav.map(({ key, to, icon: Icon }) => (
          <NavLink key={key} to={to} end={to === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', marginBottom: 2, fontSize: 14, fontFamily: 'Inter',
              color: isActive ? '#EFEFEF' : '#7A7A9A',
              background: isActive ? 'linear-gradient(135deg, rgba(124,106,247,0.18), rgba(0,229,160,0.06))' : 'transparent',
              borderLeft: isActive ? '2px solid #7C6AF7' : '2px solid transparent',
              transition: 'all 0.15s',
            })}>
            <Icon size={17} />
            {t(`dashboard.${key}`)}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{ padding: '16px', borderTop: '1px solid #1E1E32' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar name={user.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#EFEFEF', fontFamily: 'Inter', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <span style={{ fontSize: 10, color: PLAN_COLORS[user.plan] || '#7A7A9A', background: PLAN_BG[user.plan] || 'rgba(122,122,154,0.12)', borderRadius: 6, padding: '2px 7px', fontFamily: 'Inter', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {PLAN_LABELS[user.plan] || 'Free'}
              </span>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7A7A9A', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '6px 4px', fontFamily: 'Inter', width: '100%', transition: 'color 0.15s' }}
          onMouseOver={e => e.currentTarget.style.color = '#EFEFEF'}
          onMouseOut={e => e.currentTarget.style.color = '#7A7A9A'}>
          <LogOut size={15} /> {t('dashboard.logout')}
        </button>
      </div>
    </aside>
  );
}
