import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import { LayoutDashboard, Search, BookOpen, MessageSquare, Settings } from 'lucide-react';

const bottomNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Início', end: true },
  { to: '/dashboard/analyze', icon: Search, label: 'Analisar' },
  { to: '/dashboard/training', icon: BookOpen, label: 'Treino' },
  { to: '/dashboard/coach', icon: MessageSquare, label: 'Coach' },
  { to: '/dashboard/settings', icon: Settings, label: 'Config' },
];

export default function Dashboard() {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080810' }}>
      <div className="sidebar-desktop">
        <Sidebar />
      </div>
      <main className="main-content dashboard-content" style={{ marginLeft: 240, flex: 1, padding: '32px 40px', minHeight: '100vh', overflowY: 'auto' }}>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {bottomNavItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
