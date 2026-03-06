import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import RootLayout from './components/RootLayout';
import Home from './pages/Home';
import Tavern from './pages/Tavern';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import { MaintenancePage } from './pages/Maintenance';
import { MaintenanceGuard } from './components/MaintenanceGuard';
import Surveys from './pages/Surveys';
import Trivias from './pages/Trivias';
import FrikiVS from './pages/FrikiVS';
import Legal from './pages/Legal';
import OnboardingModal from './components/OnboardingModal';
import MyEvents from './pages/MyEvents';
import FrikiMart from './pages/FrikiMart';
import Notifications from './pages/NotificationSettings';
import AdminLayout from './components/AdminLayout';
import AdminRoles from './pages/admin/AdminRoles';
import AdminEvents from './pages/admin/AdminEvents';
import AdminSurveys from './pages/admin/AdminSurveys';
import AdminTrivias from './pages/admin/AdminTrivias';
import AdminQRs from './pages/admin/AdminQRs';
import AdminTavern from './pages/admin/AdminTavern';
import AdminMetrics from './pages/admin/AdminMetrics';

function OnboardingGate() {
  const { user, isLoading } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user) {
      setNeedsOnboarding(false);
      return;
    }
    setChecking(true);
    supabase
      .from('profiles')
      .select('profile_completed')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setNeedsOnboarding(data ? !data.profile_completed : false);
        setChecking(false);
      });
  }, [user?.id]);

  if (isLoading || checking) return null;

  if (user && needsOnboarding) {
    return (
      <OnboardingModal
        userId={user.id}
        onFinish={() => setNeedsOnboarding(false)}
      />
    );
  }

  return null;
}

function App() {
  return (
    <MaintenanceGuard>
      {/* Onboarding overlay — rendered above everything */}
      <OnboardingGate />

      <Routes>
        <Route element={<RootLayout />}>
          {/* Dashboard matching App Layout */}
          <Route path="/" element={<Home />} />

          {/* Taberna Thread List */}
          <Route path="/tavern" element={<Tavern />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-events" element={<MyEvents />} />
          <Route path="/frikimart" element={<FrikiMart />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Gamification */}
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/trivias" element={<Trivias />} />
          <Route path="/friki-vs" element={<FrikiVS />} />

          {/* Events Feed (Now unified with Home) */}
          <Route path="/events" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/legal/:type" element={<Legal />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminRoles />} /> {/* Default admin route */}
            <Route path="roles" element={<AdminRoles />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="surveys" element={<AdminSurveys />} />
            <Route path="trivias" element={<AdminTrivias />} />
            <Route path="qrs" element={<AdminQRs />} />
            <Route path="tavern" element={<AdminTavern />} />
            <Route path="metrics" element={<AdminMetrics />} />
          </Route>

          <Route path="*" element={<div className="p-8 text-center text-2xl font-bold text-red-500">404 - Not Found</div>} />
        </Route>
      </Routes>
    </MaintenanceGuard>
  );
}

export default App;
