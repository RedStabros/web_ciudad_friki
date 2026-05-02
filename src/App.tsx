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
import AuthCallback from './pages/AuthCallback';
import { MaintenancePage } from './pages/Maintenance';
import { MaintenanceGuard } from './components/MaintenanceGuard';
import Surveys from './pages/Surveys';
import Trivias from './pages/Trivias';
import FrikiVS from './pages/FrikiVS';
import Legal from './pages/Legal';
import Support from './pages/Support';
import AccountDeletion from './pages/AccountDeletion';
import OnboardingModal from './components/OnboardingModal';
import MyEvents from './pages/MyEvents';
import FrikiMart from './pages/FrikiMart';
import Notifications from './pages/Notifications';
import NotificationSettings from './pages/NotificationSettings';
import AdminLayout from './components/AdminLayout';
import AdminRoles from './pages/admin/AdminRoles';
import AdminEvents from './pages/admin/AdminEvents';
import AdminSurveys from './pages/admin/AdminSurveys';
import AdminTrivias from './pages/admin/AdminTrivias';
import AdminQRs from './pages/admin/AdminQRs';
import AdminTavern from './pages/admin/AdminTavern';
import AdminGM from './pages/admin/AdminGM';
import AdminFrikiMartPage from './pages/admin/AdminFrikiMartPage';
import AdminToolsPage from './pages/admin/AdminToolsPage';
import AdminBans from './pages/admin/AdminBans';

function OnboardingGate() {
  const { user, isLoading: authLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      if (!user) {
        if (isMounted) {
          setNeedsOnboarding(false);
          setIsChecking(false);
        }
        return;
      }

      setIsChecking(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('profile_completed')
          .eq('id', user.id)
          .single();

        if (isMounted) {
          setNeedsOnboarding(data ? !data.profile_completed : false);
        }
      } catch (err) {
        console.error('Onboarding check error:', err);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    }

    checkStatus();
    return () => { isMounted = false; };
  }, [user?.id]);

  if (authLoading || isChecking) return null;

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
          <Route path="/settings/notifications" element={<NotificationSettings />} />

          {/* Gamification */}
          <Route path="/surveys" element={<Surveys />} />
          <Route path="/trivias" element={<Trivias />} />
          <Route path="/friki-vs" element={<FrikiVS />} />

          {/* Events Feed (Now unified with Home) */}
          <Route path="/events" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/legal/:type" element={<Legal />} />
          <Route path="/support" element={<Support />} />
          <Route path="/account-deletion" element={<AccountDeletion />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminRoles />} /> {/* Default admin route */}
            <Route path="roles" element={<AdminRoles />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="surveys" element={<AdminSurveys />} />
            <Route path="trivias" element={<AdminTrivias />} />
            <Route path="frikimart" element={<AdminFrikiMartPage />} />
            <Route path="qrs" element={<AdminQRs />} />
            <Route path="tavern" element={<AdminTavern />} />
            <Route path="tools" element={<AdminToolsPage />} />
            <Route path="gm" element={<AdminGM />} />
            <Route path="bans" element={<AdminBans />} />
          </Route>

          <Route path="*" element={<div className="p-8 text-center text-2xl font-bold text-red-500">404 - Not Found</div>} />
        </Route>
      </Routes>
    </MaintenanceGuard>
  );
}

export default App;
