import React, { useState, useEffect } from 'react';
import { History, Target, Calculator, PieChart, ArrowRight, Wallet, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

const ReverseStrategist = () => {
    const [goal, setGoal] = useState(10000000); // 1 Crore
    const [years, setYears] = useState(10);
    const [goalData, setGoalData] = useState(null);
    const [loading, setLoading] = useState(false);

    const calculateGoal = async () => {
        setLoading(true);
        try {
            const res = await api.post('/strategy/reverse', { 
                goalQuery: `Buy a asset worth ₹${goal} in ${years} years` 
            });
            setGoalData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculateGoal();
    }, [goal, years]);

    return (
        <div className="bg-white min-h-screen font-sans">
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-24">
                <div className="text-center mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider mb-6 border border-rose-100"
                    >
                        <History className="w-3.5 h-3.5" />
                        Backward Wealth Planning
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6">
                        Reverse <span className="text-rose-500">Strategist</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                        Don't guess your returns. Define your destination, and let our engine calculate the path to get there.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl">
                            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                                <Target className="w-6 h-6 text-rose-500" />
                                Your Target
                            </h3>
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Portfolio Goal (₹)</label>
                                    <input 
                                        type="range" 
                                        min="100000" 
                                        max="100000000" 
                                        step="100000"
                                        className="w-full h-2 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                        value={goal}
                                        onChange={(e) => setGoal(Number(e.target.value))}
                                    />
                                    <div className="mt-4 text-3xl font-black text-slate-900">₹{(goal / 10000000).toFixed(1)} Cr</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Timeframe (Years)</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[3, 5, 10, 15, 25].map(y => (
                                            <button 
                                                key={y}
                                                onClick={() => setYears(y)}
                                                className={`py-3 rounded-2xl font-bold text-xs transition-all ${years === y ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                            >
                                                {y}Y
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-10 rounded-[48px] text-white">
                            <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center mb-6">
                                <Calculator className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-xl font-bold mb-4">Required Monthly Savings</h4>
                            <div className={`text-4xl font-black text-rose-400 mb-2 ${loading ? 'animate-pulse opacity-50' : ''}`}>
                                ₹{goalData ? goalData.monthlySIP.toLocaleString() : '---'}
                            </div>
                            <p className="text-slate-400 text-sm italic">*Assuming {goalData?.assumedAnnualReturn || '12.5'}% CAGR performance</p>
                        </div>
                    </div>

                    <div className="lg:col-span-8 bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-12">
                                <h3 className="text-2xl font-bold text-slate-900">{goalData?.goalTitle || 'Financial Blueprint'}</h3>
                                <Shield className="w-8 h-8 text-emerald-500 opacity-20" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    {goalData?.allocation?.map((alloc, i) => (
                                        <div key={i} className="flex gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 shrink-0 font-black border border-slate-100">
                                                {alloc.percentage}%
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-900">{alloc.type}</h5>
                                                <p className="text-sm text-slate-500">{alloc.assets}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {!goalData && <p className="text-slate-400 italic">Adjust your goal to generate allocation...</p>}
                                </div>
                                <div className="flex items-center justify-center relative">
                                    <div className="w-64 h-64 rounded-full border-[16px] border-slate-50 flex items-center justify-center relative">
                                        <div className="absolute inset-0 rounded-full border-[16px] border-rose-500 border-t-transparent border-l-transparent rotate-[45deg]" />
                                        <div className="text-center p-6">
                                            <div className="text-4xl font-black text-slate-900">₹{(goalData?.futureValuation / 10000000)?.toFixed(1) || '--'} Cr</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">FUTURE VALUE (ADJUSTED)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full mt-12 py-5 rounded-[24px] bg-slate-950 text-white font-bold flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-xl">
                            Deploy this Strategy
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReverseStrategist;
