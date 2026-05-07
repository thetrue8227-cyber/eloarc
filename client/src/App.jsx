import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Overview from './pages/dashboard/Overview';
import AnalyzeGame from './pages/dashboard/AnalyzeGame';
import PlayEngine from './pages/dashboard/PlayEngine';
import PlayerProfile from './pages/dashboard/PlayerProfile';
import TrainingPlan from './pages/dashboard/TrainingPlan';
import CoachChat from './pages/dashboard/CoachChat';
import History from './pages/dashboard/History';
import Settings from './pages/dashboard/Settings';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Refund from './pages/Refund';
import CookieBanner from './components/CookieBanner';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080810' }}>
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" style={{ borderColor: '#7C6AF7 transparent #7C6AF7 #7C6AF7' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}>
          <Route index element={<Overview />} />
          <Route path="analyze" element={<AnalyzeGame />} />
          <Route path="play" element={<PlayEngine />} />
          <Route path="profile" element={<PlayerProfile />} />
          <Route path="training" element={<TrainingPlan />} />
          <Route path="coach" element={<CoachChat />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieBanner />
    </>
  );
}
