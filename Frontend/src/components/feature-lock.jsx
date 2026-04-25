import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FeatureLock = ({ children, featureName = 'this feature', description = 'Access institutional-grade tools and AI-driven insights.' }) => {
  const { user, setShowAuthModal } = useAuth();

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      {/* Blurred Content Container */}
      <div className="filter blur-[8px] pointer-events-none select-none transition-all duration-700 opacity-60">
        {children}
      </div>

      {/* Premium Lock Overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-white p-10 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] text-center flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Lock className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
              Unlock {featureName}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              {description} Join EquiSense to access professional-grade stock analysis.
            </p>
          </div>

          <div className="flex flex-col w-full gap-4 pt-4">
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full py-5 rounded-[24px] bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              Sign In to Continue
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-orange-500" />
              Institutional Data Core Active
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureLock;
