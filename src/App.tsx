import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <MaintenanceGuard>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Dashboard matching App Layout */}
          <Route path="/" element={<Home />} />

          {/* Taberna Thread List */}
          <Route path="/tavern" element={<Tavern />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />

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

          <Route path="*" element={<div className="p-8 text-center text-2xl font-bold text-red-500">404 - Not Found</div>} />
        </Route>
      </Routes>
    </MaintenanceGuard>
  );
}

export default App;
