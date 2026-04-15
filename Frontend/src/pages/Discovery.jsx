import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, TrendingUp, TrendingDown, Map as MapIcon, Newspaper, Globe, ArrowUpRight, Zap, Target } from 'lucide-react';
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

  return (
    <div className="relative min-h-[calc(100vh-2rem)] bg-[#03060b] text-slate-200 overflow-hidden m-4 rounded-[40px] shadow-2xl border border-white/5 font-outfit">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[180px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 p-8 md:p-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-400" />
            Market Discovery
          </h1>
          <p className="mt-2 text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">Live Benchmark Indices & Momentum Scanners</p>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center min-h-[50vh]"
             >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-t-2 border-blue-400 rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                  <Target className="w-8 h-8 text-blue-400 absolute inset-0 m-auto" />
                </div>
                <h2 className="text-lg font-black tracking-widest uppercase text-white animate-pulse">Scanning Live Feeds</h2>
             </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
              className="space-y-12"
            >
              
              {/* Index Pulse Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {marketData?.pulse.map((idx, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={idx.symbol} 
                    className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl group hover:border-white/20 transition-all cursor-default"
                  >
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{idx.name}</p>
                          <p className="text-2xl font-black text-white mt-1">₹{idx.price.toLocaleString()}</p>
                       </div>
                       <div className={`p-2 rounded-xl transition-all ${idx.change >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {idx.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                       </div>
                    </div>
                    <div className={`text-sm tracking-wide font-bold ${idx.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.changePercent.toFixed(2)}%)
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Layout for Discovery Tools */}
              <div className="grid xl:grid-cols-[2fr_1fr] gap-8">
                
                {/* Live Momentum Matrix (Trending Stocks) */}
                <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
                   <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                     <h2 className="text-xl font-black text-white flex items-center gap-3">
                       <Zap className="w-6 h-6 text-fuchsia-400" />
                       Live Momentum Matrix
                     </h2>
                     <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest bg-fuchsia-500/10 px-3 py-1.5 rounded-full border border-fuchsia-500/20">
                        Top Trending Insti Flows
                     </span>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {marketData?.trending?.map((item, i) => {
                         const isPositive = item.change >= 0;
                         return (
                           <Link 
                             to="/dashboard"
                             state={{ targetSymbol: item.symbol }}
                             key={item.symbol} 
                             className="flex items-center justify-between bg-black/40 border border-white/5 p-5 rounded-2xl hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                           >
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-lg text-white tracking-tight">{item.symbol.replace('.NS', '')}</p>
                                    <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                 </div>
                                 <p className="text-xs text-slate-500 font-medium truncate max-w-[180px]">{item.name}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-lg font-black text-white">₹{item.price.toFixed(1)}</p>
                                 <p className={`text-xs font-bold tracking-wide mt-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                                 </p>
                              </div>
                           </Link>
                         );
                      })}
                   </div>
                   {(!marketData?.trending || marketData.trending.length === 0) && (
                      <div className="text-center py-12 text-slate-500 font-medium">Awaiting momentum stream injection...</div>
                   )}
                </div>

                {/* News & Catalyst Feed */}
                <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col h-full max-h-[600px] overflow-hidden">
                   <div className="flex items-center gap-3 mb-8">
                      <Newspaper className="w-6 h-6 text-blue-400" />
                      <h3 className="text-xl font-black text-white tracking-tight">Catalyst Stream</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                      {marketData?.topNews && marketData.topNews.length > 0 ? (
                        marketData.topNews.map((news, i) => (
                           <a 
                             key={i} 
                             href={news.link} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="block bg-white/[0.02] border border-white/5 hover:border-blue-500/30 p-5 rounded-2xl transition-all group"
                           >
                             <h4 className="text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-3 leading-relaxed mb-3">
                                {news.title}
                             </h4>
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded-md">{news.publisher}</span>
                                <span className="text-[10px] font-bold text-slate-600">{news.content}</span>
                             </div>
                           </a>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-50 py-10">
                           <Newspaper className="w-12 h-12 text-slate-600 mb-4" />
                           <p className="text-sm font-medium text-slate-400 text-center">No major catalysts detected currently.</p>
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
