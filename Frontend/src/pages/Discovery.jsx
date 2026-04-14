import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Zap, TrendingUp, TrendingDown, Layers, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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

  if (loading) return (
    <div className="p-8 space-y-8 animate-pulse">
       <div className="h-12 w-1/4 bg-slate-200 rounded-xl"></div>
       <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>)}
       </div>
       <div className="h-[400px] bg-slate-100 rounded-[32px]"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-600" />
          Market Pulse
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Real-time sector performance and index insights.</p>
      </header>

      {/* Index Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {marketData?.pulse.map((idx) => (
          <div key={idx.symbol} className="glass-card p-6 border-slate-100">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{idx.name}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹{idx.price.toLocaleString()}</p>
               </div>
               <div className={`p-2 rounded-xl ${idx.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {idx.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
               </div>
            </div>
            <div className={`text-sm font-bold ${idx.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
               {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({idx.changePercent.toFixed(2)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap Section */}
      <section className="space-y-6">
         <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
             <MapIcon className="w-6 h-6 text-indigo-600" />
             Sector Heatmap
           </h2>
           <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">Updated Live</span>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {marketData?.heatmap.map((item) => {
               const isPositive = item.change >= 0;
               const absVal = Math.abs(item.change);
               const intensity = Math.min(Math.floor(absVal * 30), 100);
               
               return (
                 <motion.div 
                   whileHover={{ scale: 1.05 }}
                   key={item.sector} 
                   className={`h-32 rounded-3xl flex flex-col items-center justify-center p-4 shadow-sm border transition-all cursor-pointer ${
                      isPositive 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                      : 'bg-rose-50 border-rose-100 text-rose-700'
                   }`}
                   style={{
                      opacity: 0.6 + (intensity / 200)
                   }}
                 >
                    <p className="text-xs font-black uppercase tracking-tighter opacity-70 mb-1">{item.sector}</p>
                    <p className="text-xl font-black">{isPositive ? '+' : ''}{item.change}%</p>
                    <p className="text-[10px] font-bold mt-2 px-2 py-0.5 rounded-full bg-white/50">{item.status}</p>
                 </motion.div>
               );
            })}
         </div>
      </section>

      {/* Market Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="glass-card p-8 border-indigo-100 bg-indigo-50/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Zap className="w-5 h-5 text-indigo-600" />
               Technical Overbought
            </h3>
            <div className="space-y-4">
               {[1,2,3].map(i => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400">#</div>
                       <div>
                          <p className="font-bold text-slate-900">Reliance Industries</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">RSI: 78.4 (Overbought)</p>
                       </div>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 font-bold text-sm">Analyze</button>
                 </div>
               ))}
            </div>
         </div>

         <div className="glass-card p-8 border-emerald-100 bg-emerald-50/5">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Layers className="w-5 h-5 text-emerald-600" />
               Market Sentiment
            </h3>
            <div className="flex flex-col items-center justify-center h-48">
               <div className="text-5xl font-black text-slate-900 mb-2">Greed</div>
               <div className="w-full max-w-xs h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[72%] shadow-[0_0_12px_rgba(16,185,129,0.4)]"></div>
               </div>
               <p className="text-slate-400 text-xs font-bold mt-4 uppercase tracking-widest">Sentiment Score: 72/100</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Discovery;
