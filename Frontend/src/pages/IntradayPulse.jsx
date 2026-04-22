import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap, BarChart3, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

const IntradayPulse = () => {
    const [pulseData, setPulseData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPulse = async () => {
        try {
            setLoading(true);
            const res = await api.post('/strategy/intraday', { sector: 'any' });
            setPulseData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPulse();
    }, []);
    return (
        <div className="bg-white min-h-screen">
            <section className="relative py-24 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-slate-50/50 -z-10" />
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs mb-8 border border-emerald-100"
                    >
                        <Zap className="w-3 h-3 fill-current" />
                        LIVE MOMENTUM TRACKER
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6">
                        Intraday <span className="text-blue-600">Pulse</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-12">
                        Real-time quantitative momentum analysis. Identify breakout opportunities across 5000+ stocks in milliseconds.
                    </p>
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                    {loading ? (
                       [1,2,3].map(i => <div key={i} className="h-64 bg-slate-50 rounded-[40px] animate-pulse" />)
                    ) : (
                        pulseData?.picks?.map((pick) => (
                            <div key={pick.symbol} className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest ${pick.sentiment > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                    {pick.sentimentHeadline}
                                </div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
                                        {pick.symbol[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{pick.symbol}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pick.name}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 mb-8 border-y border-slate-100 py-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium italic">Current Price</span>
                                        <span className="font-black text-slate-900">₹{pick.currentPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium italic">Target Zone</span>
                                        <span className="font-black text-emerald-600">₹{pick.target}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium italic">Signal</span>
                                        <span className="font-black text-blue-600 uppercase tracking-widest">{pick.signal}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs">
                                        <TrendingUp className="w-4 h-4" />
                                        {pick.return5.toFixed(2)}%
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-500 font-bold text-xs uppercase underline underline-offset-4 cursor-pointer">
                                        View Logic
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="py-24 bg-slate-900 mx-6 rounded-[80px] mb-24 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
                <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">High-Frequency Data at your fingertips.</h2>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-3xl font-bold text-blue-400 mb-2">3ms</h4>
                                <p className="text-slate-400 text-sm">Update Latency</p>
                            </div>
                            <div>
                                <h4 className="text-3xl font-bold text-blue-400 mb-2">5k+</h4>
                                <p className="text-slate-400 text-sm">Stocks Tracked</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 aspect-video flex items-center justify-center">
                        <BarChart3 className="w-24 h-24 text-blue-500 opacity-20 animate-pulse" />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default IntradayPulse;
