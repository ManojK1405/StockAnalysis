import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Newspaper, Compass, Settings, LogOut, Briefcase, Sparkles, Bell, Zap } from 'lucide-react';
import { AuthProvider, useAuth } from './store/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Portfolio from './pages/Portfolio';
import Strategist from './pages/Strategist';
import Discovery from './pages/Discovery';
import Alerts from './pages/Alerts';
import Intraday from './pages/Intraday';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const Navbar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Discovery', icon: Compass, path: '/discovery' },
    { name: 'Intraday', icon: Zap, path: '/intraday' },
    { name: 'AI Strategist', icon: Sparkles, path: '/strategist' },
    { name: 'Portfolio', icon: Briefcase, path: '/portfolio' },
    { name: 'Alerts', icon: Bell, path: '/alerts' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#03060b]/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white italic text-xl shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">S</div>
          <span className="text-2xl font-black tracking-tighter text-white">Stock<span className="text-blue-500">Vantage</span></span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
           <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
              {user.name?.[0] || user.email[0]}
           </div>
           <div className="hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{user.name || 'Elite Investor'}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">{user.email?.split('@')[0]}</p>
           </div>
        </div>
        <button 
          onClick={logout}
          className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all group"
          title="System Logout"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </nav>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-[#03060b] text-slate-200">
      <AuthProvider>
        <Navbar />
        <main className="pt-20">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/intraday" element={<ProtectedRoute><Intraday /></ProtectedRoute>} />
            <Route path="/strategist" element={<ProtectedRoute><Strategist /></ProtectedRoute>} />
            <Route path="/discovery" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </AuthProvider>
    </div>
  );
}

export default App;
