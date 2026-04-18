import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, TrendingDown, Map as MapIcon, Newspaper, Globe, ArrowUpRight, Zap, Target, BarChart2, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Discovery = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const resp = await axios.get('http://localhost:5001/api/market/summary');
        setMarketData(resp.data);
      } catch (e) {
        console.error('Market fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMarket();
  }, []);

  const topGainers = marketData?.trending?.filter(t => t.change >= 0).sort((a,b) => b.changePercent - a.changePercent) || [];
  const topLosers = marketData?.trending?.filter(t => t.change < 0).sort((a,b) => a.changePercent - b.changePercent) || [];
  
  const totalTracked = (marketData?.trending?.length || 0) + (marketData?.pulse?.length || 0);
  const totalAdvances = (topGainers.length) + (marketData?.pulse?.filter(p => p.change >= 0).length || 0);
  const advanceRatio = totalTracked > 0 ? (totalAdvances / totalTracked) * 100 : 50;

  return (
    <div className="relative min-h-[calc(100vh-2rem)] bg-[#03060b] text-slate-200 overflow-hidden m-4 rounded-[40px] shadow-2xl border border-white/5 font-outfit">
      
      {/* Premium Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[180px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute right-[-10%] top-[20%] w-[50%] h-[50%] bg-emerald-600/5 blur-[160px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[10%] w-[60%] h-[60%] bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 p-8 md:p-12">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Globe className="w-10 h-10 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
              EquiSense Terminal
            </h1>
            <p className="mt-3 text-sm text-slate-400 font-bold uppercase tracking-[0.25em]">Live Institutional Discovery Engine</p>
          </div>
          
          {/* Market Breadth Meter */}
          {marketData && (
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[280px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Market Breadth (A/D)</span>
                <span className={`text-xs font-black ${advanceRatio > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {advanceRatio.toFixed(0)}% Bullish
                </span>
              </div>
              <div className="h-2 w-full bg-rose-500/30 rounded-full overflow-hidden flex">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${advanceRatio}%` }} 
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" 
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-emerald-500">{totalAdvances} Advances</span>
                <span className="text-[10px] font-bold text-rose-500">{totalTracked - totalAdvances} Declines</span>
              </div>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center min-h-[60vh]"
             >
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin shadow-[0_0_30px_rgba(59,130,246,0.4)]" />
                  <div className="absolute inset-4 border-b-4 border-fuchsia-500 rounded-full animate-spin shadow-[0_0_20px_rgba(217,70,239,0.3)]" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <Target className="w-10 h-10 text-white absolute inset-0 m-auto animate-pulse" />
                </div>
                <h2 className="text-xl font-black tracking-[0.3em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-fuchsia-400">
                  Aggregating Global Feeds
                </h2>
             </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
              className="space-y-12"
            >
              
              {/* Benchmark Indices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {marketData?.pulse.map((idx, i) => {
                  const isPos = idx.change >= 0;
                  return (
                    <motion.div 
                      key={idx.symbol}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative overflow-hidden bg-gradient-to-br from-[#090d14]/90 to-[#03060b]/90 backdrop-blur-2xl border ${isPos ? 'border-emerald-500/20' : 'border-rose-500/20'} p-6 rounded-[28px] shadow-2xl group hover:-translate-y-1 transition-all duration-300`}
                    >
                      {/* Glow effect */}
                      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-[50px] opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 ${isPos ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{idx.name}</p>
                            <p className="text-3xl font-black text-white mt-1">₹{idx.price.toLocaleString()}</p>
                         </div>
                         <div className={`p-2.5 rounded-2xl backdrop-blur-md ${isPos ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {isPos ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-base tracking-wide font-black px-3 py-1 rounded-lg ${isPos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                           {isPos ? '+' : ''}{idx.change.toFixed(2)} ({idx.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Discovery Main Layout */}
              <div className="grid xl:grid-cols-[1.5fr_1fr] gap-8">
                
                {/* Active Momentum Scanners (Gainers vs Losers) */}
                <div className="space-y-8">
                  
                  {/* Gainers */}
                  <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
                     <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                       <h2 className="text-xl font-black text-white flex items-center gap-3">
                         <Zap className="w-6 h-6 text-emerald-400" />
                         Institutional Accumulation
                       </h2>
                       <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">Top Gainers</span>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {topGainers.map((item) => (
                          <Link 
                            to="/dashboard"
                            state={{ targetSymbol: item.symbol }}
                            key={item.symbol} 
                            className="flex items-center justify-between bg-emerald-500/[0.02] border border-emerald-500/10 p-5 rounded-2xl hover:bg-emerald-500/[0.08] hover:border-emerald-500/30 transition-all group"
                          >
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <p className="font-bold text-lg text-white tracking-tight">{item.symbol.replace('.NS', '')}</p>
                                   <ArrowUpRight className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{item.name}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-base font-black text-white">₹{item.price.toFixed(1)}</p>
                                <p className="text-xs font-bold tracking-wide mt-1 text-emerald-400">+{item.changePercent.toFixed(2)}%</p>
                             </div>
                          </Link>
                        ))}
                        {topGainers.length === 0 && <p className="text-slate-500 text-sm font-medium p-4">No significant gainers currently actively traded.</p>}
                     </div>
                  </div>

                  {/* Losers */}
                  <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-transparent" />
                     <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                       <h2 className="text-xl font-black text-white flex items-center gap-3">
                         <Activity className="w-6 h-6 text-rose-400" />
                         Heavy Distribution
                       </h2>
                       <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20">Top Losers</span>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {topLosers.map((item) => (
                          <Link 
                            to="/dashboard"
                            state={{ targetSymbol: item.symbol }}
                            key={item.symbol} 
                            className="flex items-center justify-between bg-rose-500/[0.02] border border-rose-500/10 p-5 rounded-2xl hover:bg-rose-500/[0.08] hover:border-rose-500/30 transition-all group"
                          >
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <p className="font-bold text-lg text-white tracking-tight">{item.symbol.replace('.NS', '')}</p>
                                   <TrendingDown className="w-4 h-4 text-rose-500/50 group-hover:text-rose-400 transition-colors" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{item.name}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-base font-black text-white">₹{item.price.toFixed(1)}</p>
                                <p className="text-xs font-bold tracking-wide mt-1 text-rose-400">{item.changePercent.toFixed(2)}%</p>
                             </div>
                          </Link>
                        ))}
                        {topLosers.length === 0 && <p className="text-slate-500 text-sm font-medium p-4">No significant losers currently actively traded.</p>}
                     </div>
                  </div>

                </div>

                {/* News & Catalyst Feed */}
                <div className="bg-[#090d14]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col h-full min-h-[600px]">
                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <Newspaper className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-black text-white tracking-tight">Catalyst Stream</h3>
                      </div>
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                      </span>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto pr-3 space-y-5 custom-scrollbar">
                      {marketData?.topNews && marketData.topNews.length > 0 ? (
                        marketData.topNews.map((news, i) => (
                           <motion.a 
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: 0.3 + (i * 0.1) }}
                             key={i} 
                             href={news.link} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="block bg-black/40 border border-white/5 hover:bg-blue-900/10 hover:border-blue-500/30 p-6 rounded-2xl transition-all group"
                           >
                             <div className="flex items-center gap-2 mb-3">
                               <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                                  {news.publisher}
                               </span>
                               <span className="text-[10px] text-slate-500 font-bold">{news.content}</span>
                             </div>
                             <h4 className="text-base font-bold text-slate-200 group-hover:text-white transition-colors leading-snug">
                                {news.title}
                             </h4>
                           </motion.a>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 py-20">
                           <Newspaper className="w-16 h-16 text-slate-700 mb-6" />
                           <p className="text-base font-black uppercase tracking-widest text-slate-500 text-center">No Major Catalysts Detected</p>
                           <p className="text-xs text-slate-600 mt-2 text-center max-w-[250px]">The algorithm is currently not picking up highly impactful news events for the tracked sectors.</p>
                        </div>
                      )}
                   </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Discovery;
