import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, RefreshCw, ShieldCheck, Sparkles, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { getIntradayPulse } from '../api/index.js';

const SECTORS = [
  { id: 'any', label: 'All Markets' },
  { id: 'technology', label: 'Technology' },
  { id: 'banking', label: 'Banking' },
  { id: 'energy', label: 'Energy' },
  { id: 'auto', label: 'Auto' },
  { id: 'pharma', label: 'Pharma' },
  { id: 'consumer', label: 'Consumer' },
];

const formatINR = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const Intraday = () => {
  const [sector, setSector] = useState('any');
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPulse = async () => {
    setLoading(true);
    setError('');
    document.documentElement.style.setProperty('--primary', '#00f2fe'); // Ensures glow matches context
    try {
      const res = await getIntradayPulse({ sector });
      setPulse(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch intraday pulse. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPulse();
  }, [sector]);

  return (
    <div className="relative min-h-screen bg-[#03060b] text-slate-200 overflow-hidden m-4 rounded-[40px] shadow-2xl border border-white/5">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 p-8 md:p-12 h-full">
        {/* Header Section */}
        <div className="mb-14">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-cyan-500/30 px-3 py-1.5 text-xs font-bold text-cyan-400 uppercase tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)]"
              >
                <Activity className="w-3.5 h-3.5" /> Live Signal Generation
              </motion.div>
              <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-white m-0 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Tactical <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">Intraday Pulse</span>
              </h1>
              <p className="mt-4 text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
                Discover algorithmic high-conviction intraday setups driven by real-time momentum, volume clusters, and live market sentiment.
              </p>
              <div className="mt-6 inline-flex items-start gap-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 max-w-2xl backdrop-blur-md">
                 <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                 <p className="text-xs text-indigo-200/90 leading-relaxed font-medium">
                    <strong className="text-indigo-400 tracking-wide uppercase">Score Guide: </strong> 
                    The algorithmic score aggregates Momentum (price vs 5-day history), Volume Spikes (sudden influx of trades), RSI bounds, Short-Term Trend alignment, and Live News Sentiment. A higher score equals a stronger conviction for an upcoming breakout.
                 </p>
              </div>
            </div>
            
            <button
              onClick={fetchPulse}
              disabled={loading}
              className="group relative inline-flex items-center gap-2 rounded-full px-8 py-4 font-bold text-white overflow-hidden transition-all hover:scale-105 active:scale-95 border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-cyan-600 opacity-80 group-hover:opacity-100 transition-opacity" />
              <RefreshCw className={`w-5 h-5 relative z-10 ${loading ? 'animate-spin' : ''}`} /> 
              <span className="relative z-10 tracking-wide">Sync Data</span>
            </button>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 pb-2 border-b border-white/5">
            {SECTORS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSector(item.id)}
                className={`rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-bold transition-all duration-300 ${
                  sector === item.id 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(0,242,254,0.1)]' 
                    : 'bg-white/5 border border-transparent text-slate-500 hover:bg-white/10 hover:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-3"
            >
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-[280px] rounded-[32px] bg-white/5 border border-white/5 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite] -translate-x-full" />
                </div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[32px] border border-rose-500/30 bg-rose-500/10 p-10 text-center backdrop-blur-md"
            >
              <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
              <p className="text-xl font-bold text-white">{error}</p>
              <p className="mt-2 text-rose-200/70 font-medium">Try again after a moment or change the sector filter.</p>
            </motion.div>
          ) : pulse ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, staggerChildren: 0.1 }}
              className="space-y-10"
            >
              {/* Macro Pulse Summary */}
              <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
                {/* Scorecard */}
                <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col justify-between group hover:border-cyan-500/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,242,254,0.6)]" />
                      <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400">Market Pulse</span>
                    </div>
                    <h2 className="mt-4 text-4xl font-extrabold text-white">
                      {pulse.picks[0]?.signal || 'Adaptive'}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500 uppercase tracking-wider">{sector === 'any' ? 'Broad Market' : sector}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-2">Nifty 50</p>
                      <div className="flex items-center gap-2">
                        {pulse.marketPulse.niftyReturn >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                        <span className={`text-2xl font-bold ${pulse.marketPulse.niftyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {pulse.marketPulse.niftyReturn?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-2">Bank Nifty</p>
                      <div className="flex items-center gap-2">
                        {pulse.marketPulse.bankNiftyReturn >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
                        <span className={`text-2xl font-bold ${pulse.marketPulse.bankNiftyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {pulse.marketPulse.bankNiftyReturn?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="rounded-[32px] border border-indigo-500/20 bg-indigo-900/10 backdrop-blur-xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-20">
                    <Sparkles className="w-24 h-24 text-indigo-400" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-indigo-400 pt-1 pb-4 block border-b border-indigo-500/20 mb-6">Analyst Commentary</span>
                    <p className="text-xl md:text-2xl leading-relaxed text-indigo-50 font-medium">{pulse.summary}</p>
                    <div className="mt-8 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-200/80">Guarded explicitly. Watch levels strictly.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signals Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {pulse.picks.map((item, id) => (
                  <motion.div
                    key={item.symbol}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: id * 0.1, duration: 0.5 }}
                    className="group rounded-[32px] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm hover:border-cyan-500/40 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-black">
                            {item.rank}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Conviction Setup</span>
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tight">{item.symbol}</h3>
                        <p className="text-sm font-medium text-slate-400 mt-1 truncate max-w-[200px]">{item.name}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3 text-right">
                        <span className={`rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-widest border ${
                          item.score >= 30 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                          : item.score >= 10 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                          : 'bg-white/5 text-slate-300 border-white/10'
                        }`}>
                          {item.signal}
                        </span>
                        <span className="text-xl font-bold text-white drop-shadow-md">
                          {Math.abs(item.score)} <span className="text-[10px] text-slate-500 uppercase tracking-widest ml-1">Score</span>
                        </span>
                      </div>
                    </div>

                    {/* Trade Levels */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-black/30 p-3 lg:p-4 shrink-0 transition-colors group-hover:border-white/10">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">Entry Zone</p>
                        <p className="font-bold text-[13px] lg:text-sm text-white tracking-tight">₹{item.entry}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/30 p-3 lg:p-4 shrink-0 transition-colors group-hover:border-cyan-500/20">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-500 mb-2 drop-shadow-md">Target Area</p>
                        <p className="font-bold text-[13px] lg:text-sm text-cyan-400 tracking-tight">₹{item.target}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/30 p-3 lg:p-4 shrink-0 transition-colors group-hover:border-rose-500/20">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-rose-500 mb-2 drop-shadow-md">Stop Range</p>
                        <p className="font-bold text-[13px] lg:text-sm text-rose-400 tracking-tight">₹{item.stopLoss}</p>
                      </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="mt-8 space-y-4">
                      {/* Technicals */}
                      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5">
                         <div className="grid grid-cols-4 gap-4 divide-x divide-white/10">
                            <div className="text-center">
                               <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Return(5D)</p>
                               <p className={`text-sm font-bold ${item.return5 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{item.return5 > 0 ? '+' : ''}{item.return5}%</p>
                            </div>
                            <div className="text-center pl-4">
                               <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Vol Spike</p>
                               <p className="text-sm font-bold text-white">{item.volumeSpike}x</p>
                            </div>
                            <div className="text-center pl-4">
                               <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">RSI (14)</p>
                               <p className="text-sm font-bold text-white">{item.currentRSI}</p>
                            </div>
                            <div className="text-center pl-4">
                               <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Trend</p>
                               <p className={`text-[10px] uppercase font-black tracking-widest mt-1.5 ${item.trend === 'bullish' ? 'text-emerald-400' : item.trend === 'bearish' ? 'text-rose-400' : 'text-slate-400'}`}>
                                 {item.trend}
                               </p>
                            </div>
                         </div>
                      </div>

                      {/* Rationale notes */}
                      <div className="rounded-2xl border border-white/5 bg-white/[0.01] border-l-2 border-l-indigo-500 p-5 mt-4">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-3">Why this stock?</p>
                        <ul className="space-y-3">
                          {item.notes.map((note, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span className="text-xs text-slate-300 leading-relaxed font-medium">{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between border-t border-white/5 pt-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span>Support <span className="text-slate-300 ml-1">₹{item.support}</span></span>
                      <span>Resistance <span className="text-slate-300 ml-1">₹{item.resistance}</span></span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Intraday;
