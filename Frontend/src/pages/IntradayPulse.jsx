import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap, BarChart3, Clock, ArrowUpRight, ArrowDownRight, Target, Cpu, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const IntradayPulse = () => {
    const [pulseData, setPulseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSector, setActiveSector] = useState('any');

    const fetchPulse = async () => {
        try {
            setLoading(true);
            const res = await api.post('/strategy/intraday', { sector: activeSector });
            setPulseData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPulse();
    }, [activeSector]);

    return (
        <div className="bg-white min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Premium Navigation/Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50/50">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full -mr-96 -mt-96" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full -ml-48 -mb-48" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center text-center">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-8 border border-blue-100 shadow-sm"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                            </span>
                            Live Momentum Core
                        </motion.div>
                        
                        <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8">
                            Intraday <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Pulse</span>
                        </h1>
                        
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium mb-12">
                            High-frequency quantitative analysis of the Indian equity markets. 
                            Identifying institutional breakouts in real-time.
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            {['any', 'IT', 'Banking', 'Auto', 'Energy'].map((s) => (
                                <button 
                                    key={s}
                                    onClick={() => setActiveSector(s)}
                                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeSector === s 
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' 
                                        : 'bg-white text-slate-400 border border-slate-100 hover:border-blue-200 hover:text-blue-600'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Grid of Picks */}
            <section className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            [1,2,3,4,5,6].map(i => (
                                <div key={i} className="bg-slate-50/50 h-[450px] rounded-[48px] animate-pulse border border-slate-100" />
                            ))
                        ) : (
                            pulseData?.picks?.map((pick, idx) => (
                                <motion.div 
                                    key={pick.symbol}
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ y: -10 }}
                                    className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_30px_70px_rgba(0,0,0,0.06)] transition-all group relative flex flex-col h-full"
                                >
                                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full -mr-16 -mt-16 opacity-10 transition-colors duration-700 ${
                                        pick.sentiment > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`} />

                                    {/* Sentiment Badge */}
                                    <div className={`absolute top-8 right-8 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border shadow-sm backdrop-blur-md transition-all duration-500 ${
                                        pick.sentiment > 0 
                                        ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100' 
                                        : 'bg-rose-50/50 text-rose-600 border-rose-100'
                                    }`}>
                                        {pick.sentimentHeadline}
                                    </div>

                                    {/* Header */}
                                    <div className="flex items-center gap-5 mb-10 relative z-10">
                                        <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-900 font-black text-2xl border border-slate-100 shadow-sm group-hover:bg-white group-hover:border-blue-100 group-hover:scale-105 transition-all duration-500">
                                            {pick.symbol[0]}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">{pick.symbol}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-2">{pick.name}</p>
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                                        <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100/50 transition-all duration-500 group-hover:bg-white group-hover:border-blue-100/50 group-hover:shadow-lg group-hover:shadow-blue-900/5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Live Price</p>
                                            <p className="text-xl font-black text-slate-900 tracking-tighter">₹{pick.currentPrice.toLocaleString()}</p>
                                        </div>
                                        <div className="p-5 rounded-[28px] bg-slate-50/50 border border-slate-100/50 transition-all duration-500 group-hover:bg-white group-hover:border-blue-100/50 group-hover:shadow-lg group-hover:shadow-blue-900/5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Mtm (5m)</p>
                                            <p className={`text-xl font-black tracking-tighter ${pick.return5 > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {pick.return5 > 0 ? '+' : ''}{pick.return5.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Signal Section */}
                                    <div className="space-y-8 flex-1 relative z-10">
                                        <div className="flex justify-between items-center pb-5 border-b border-slate-100/50">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Status</span>
                                            <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${
                                                pick.signal.includes('BUY') || pick.signal.includes('LONG') ? 'text-emerald-600' : 
                                                pick.signal.includes('SELL') || pick.signal.includes('SHORT') ? 'text-rose-600' : 'text-slate-400'
                                            }`}>
                                                {pick.signal}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="mt-10 pt-8 border-t border-slate-100/50 flex items-center justify-between relative z-10">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Zone</span>
                                            <span className="text-[15px] font-black text-slate-900 tracking-tighter">
                                                ₹{pick.target?.toLocaleString() || 'N/A'}
                                            </span>
                                        </div>
                                        <button className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] hover:gap-4 transition-all group/btn bg-blue-50/50 px-5 py-2.5 rounded-full border border-blue-100/50 hover:bg-blue-600 hover:text-white hover:border-blue-600">
                                            Quant Logic
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* Performance Banner */}
            <section className="py-24 bg-slate-900 mx-6 rounded-[80px] mb-24 overflow-hidden relative shadow-2xl shadow-blue-900/20">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/10 blur-[150px] rounded-full -mr-96 -mt-96" />
                <div className="max-w-7xl mx-auto px-12 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-16">
                        <div className="max-w-xl">
                            <h2 className="text-5xl font-black text-white mb-8 leading-tight tracking-tighter">Institutional Speed. <br/><span className="text-blue-500 italic font-medium">No Compromises.</span></h2>
                            <p className="text-slate-400 text-lg mb-12 font-medium leading-relaxed">
                                Our proprietary data engine process 50,000+ data points per second to deliver the Intraday Pulse.
                            </p>
                            <div className="grid grid-cols-2 gap-12">
                                <div>
                                    <p className="text-4xl font-black text-white tracking-tighter mb-2">3.2ms</p>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Global Latency</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white tracking-tighter mb-2">5,400+</p>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Assets Monitored</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-[500px] aspect-square rounded-[60px] bg-white/5 backdrop-blur-3xl border border-white/10 p-12 flex flex-col justify-between">
                            <Cpu className="w-16 h-16 text-blue-500" />
                            <div className="space-y-4">
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-3/4 bg-blue-600" />
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-1/2 bg-indigo-600" />
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-5/6 bg-emerald-600" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center">
                                    <RefreshCw className="w-6 h-6 text-blue-500 animate-spin-slow" />
                                </div>
                                <p className="text-xs font-black text-white uppercase tracking-widest">Engine Sync: 100%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default IntradayPulse;
