import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Newspaper, Compass, Settings, LogOut, Briefcase, Sparkles, Bell } from 'lucide-react';
import { AuthProvider, useAuth } from './store/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Portfolio from './pages/Portfolio';
import Strategist from './pages/Strategist';
import Discovery from './pages/Discovery';
import Alerts from './pages/Alerts';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const Sidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { name: 'Index Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Market Discovery', icon: Compass, path: '/discovery' },
    { name: 'AI Strategist', icon: Sparkles, path: '/strategist' },
    { name: 'Portfolio Hub', icon: Briefcase, path: '/portfolio' },
    { name: 'Alerts Center', icon: Bell, path: '/alerts' },
  ];

  return (
    <nav className="w-72 border-r border-slate-200 p-8 flex flex-col gap-10 bg-white h-screen sticky top-0 shadow-sm">
      <div className="flex items-center gap-4 px-2">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white italic text-xl shadow-lg shadow-indigo-600/20">S</div>
        <span className="text-2xl font-bold tracking-tighter text-slate-900">Stock<span className="text-indigo-600">Vantage</span></span>
      </div>

      <div className="space-y-3 flex-1">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Master View</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'group-hover:text-indigo-600'}`} />
              <span className="font-bold text-sm tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-8 border-t border-slate-100 space-y-4">
        <div className="px-5 py-4 rounded-2xl bg-slate-50 flex items-center gap-4 border border-slate-100 mb-4 shadow-sm">
           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm uppercase">
              {user.name?.[0] || user.email[0]}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name || 'Elite Investor'}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-widest">{user.email?.split('@')[0]}</p>
           </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all w-full group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-sm tracking-tight">System Logout</span>
        </button>
      </div>
    </nav>
  );
};

function App() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      <AuthProvider>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
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
