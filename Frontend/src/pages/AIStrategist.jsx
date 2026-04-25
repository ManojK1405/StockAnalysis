import React, { useState } from 'react';
import { Brain, Sparkles, Zap, TrendingUp, ShieldCheck, Layers, Share2, Download, RefreshCw, Save, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import FeatureLock from '../components/feature-lock';

const formatINR = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString()}`;
};

const AIStrategist = () => {
    const [loading, setLoading] = useState(false);
    const [mandate, setMandate] = useState({
        amount: '500000',
        riskLevel: 'moderate',
        horizon: '5',
        sectors: ['any']
    });
    const [strategy, setStrategy] = useState(null);
    const [backtestData, setBacktestData] = useState(null);
    const [backtestLoading, setBacktestLoading] = useState(false);

    const runBacktest = async () => {
        if (!strategy) return;
        setBacktestLoading(true);
        try {
            const res = await api.post('/strategy/backtest', {
                allocation: strategy.allocation,
                horizon: mandate.horizon,
                amount: mandate.amount
            });
            setBacktestData(res.data);
        } catch (e) {
            console.error(e);
            alert('Backtest Engine Error: Unable to complete historical simulation.');
        } finally {
            setBacktestLoading(false);
        }
    };

    const generateFullPlan = async () => {
        setLoading(true);
        setBacktestData(null);
        try {
            const payload = { ...mandate, sector: mandate.sectors.join(', ') };
            const res = await api.post('/strategy/generate', payload);
            setStrategy(res.data);
        } catch (e) {
            console.error(e);
            alert('Strategy Execution Error: Unable to resolve market liquidity for the requested mandate.');
        } finally {
            setLoading(false);
        }
    };

    const saveStrategyToDB = async (strategyData) => {
        try {
            await api.post('/strategy/save', {
                name: strategyData.strategyTitle,
                description: strategyData.summary,
                strategyData,
                isPublic: false
            });
            alert('Strategy saved successfully to your vault.');
        } catch (e) {
            console.error('Save error', e);
            alert('Failed to save strategy.');
        }
    };

    return (
        <div className="bg-white min-h-screen font-sans selection:bg-rose-100 selection:text-rose-900 relative">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-rose-500/5 blur-[150px] rounded-full -mr-96 -mt-96" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-orange-500/5 blur-[150px] rounded-full -ml-48 -mb-48" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                    {/* ── Left Column: Mandate ── */}
                    <div className="lg:col-span-5 space-y-10">
                        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>

                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.3em] mb-10 border border-slate-800 shadow-2xl">
                                <Sparkles className="w-3 h-3 text-rose-400" />
                                Institutional Mandate Setup
                            </div>

                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight mb-8 pb-2">
                                AI <span className="text-premium italic">Strategist</span>
                            </h1>

                            {/* Mandate Form */}
                            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 blur-3xl rounded-full -mr-16 -mt-16" />

                                {/* Capital */}
                                <div className="space-y-4 relative z-10">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capital Commitment (₹)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="e.g. 500000"
                                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-xl text-slate-900 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5 transition-all"
                                            value={mandate.amount}
                                            onChange={(e) => setMandate({ ...mandate, amount: e.target.value })}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-black">INR</div>
                                    </div>
                                </div>

                                {/* Risk */}
                                <div className="space-y-4 relative z-10">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Risk Appetite</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['conservative', 'moderate', 'aggressive'].map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setMandate({ ...mandate, riskLevel: r })}
                                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${mandate.riskLevel === r
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                    : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Horizon & Sector */}
                                <div className="space-y-8 relative z-10">
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Horizon</label>
                                            <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">
                                                {mandate.horizon} Year{mandate.horizon > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="1" max="20" step="1"
                                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                            value={mandate.horizon}
                                            onChange={(e) => setMandate({ ...mandate, horizon: e.target.value })}
                                        />
                                        <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest px-1">
                                            <span>Short Term</span>
                                            <span>Institutional Hold</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector Bias (Multi-Select)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { id: 'any', label: 'Diversified' },
                                                { id: 'IT', label: 'Tech & SaaS' },
                                                { id: 'Banking', label: 'Banking' },
                                                { id: 'Auto', label: 'Automotive' },
                                                { id: 'Energy', label: 'Energy' },
                                                { id: 'Pharma', label: 'Pharma' }
                                            ].map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => {
                                                        if (s.id === 'any') {
                                                            setMandate({ ...mandate, sectors: ['any'] });
                                                        } else {
                                                            const current = mandate.sectors.filter(x => x !== 'any');
                                                            const next = current.includes(s.id)
                                                                ? current.filter(x => x !== s.id)
                                                                : [...current, s.id];
                                                            setMandate({ ...mandate, sectors: next.length ? next : ['any'] });
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${mandate.sectors.includes(s.id)
                                                        ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-900/10'
                                                        : 'bg-white text-slate-400 border-slate-100 hover:border-rose-200 hover:text-rose-600'}`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={generateFullPlan}
                                    disabled={loading}
                                    className="w-full py-5 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                                    {loading ? 'Architecting...' : 'Generate Plan'}
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Right Column: Output Terminal ── */}
                    <div className="lg:col-span-7">
                        <FeatureLock featureName="AI Strategy Engine" description="Unlock institutional-grade investment orangeprints and historical backtest simulations.">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white rounded-[60px] border border-slate-200 shadow-[0_40px_100px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden relative min-h-[500px]"
                            >
                                {/* Header */}
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between backdrop-blur-xl relative z-10 shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                                            <Brain className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1.5">Architect Output</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Awaiting Execution</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all">
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        <button className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all">
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Output */}
                                <div className="flex-1 p-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] flex flex-col justify-center">
                                    <AnimatePresence mode="wait">
                                        {loading ? (
                                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center space-y-6 py-20"
                                            >
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-rose-500 rounded-full blur-xl opacity-20 animate-pulse" />
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center relative z-10">
                                                        <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-black text-slate-900 text-lg tracking-tight mb-1">Architecting Blueprint...</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing Market Liquidity & Technicals</p>
                                                </div>
                                            </motion.div>
                                        ) : strategy ? (
                                            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                                className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl shadow-slate-900/5 flex flex-col"
                                            >
                                                {/* Dark header */}
                                                {/* Light header */}
                                                <div className="p-10 bg-slate-50 text-slate-900 relative overflow-hidden shrink-0 border-b border-slate-100">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full" />
                                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 blur-[80px] rounded-full" />

                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start mb-8">
                                                            <div className="max-w-[55%]">
                                                                <div className="flex gap-3 mb-4">
                                                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-rose-600 uppercase tracking-widest shadow-sm">
                                                                        {strategy.riskScore} Risk
                                                                    </span>
                                                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-orange-600 uppercase tracking-widest shadow-sm">
                                                                        {strategy.horizon}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-black text-slate-900 text-3xl tracking-tight leading-tight uppercase italic underline decoration-rose-500 decoration-4 underline-offset-8 mb-4">{strategy.strategyTitle}</h4>
                                                            </div>
                                                            <div className="flex gap-4 text-right shrink-0">
                                                                <div className="bg-white px-6 py-5 rounded-[24px] border border-slate-100 shadow-xl min-w-[140px] flex flex-col justify-center">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Target CAGR</p>
                                                                    <p className="font-black text-emerald-600 text-2xl">{strategy.projectedReturnRange}</p>
                                                                </div>
                                                                {(() => {
                                                                    const matches = strategy.projectedReturnRange.match(/\d+(\.\d+)?/g);
                                                                    if (!matches || matches.length === 0) return null;
                                                                    const avgRate = (matches.reduce((a, b) => a + parseFloat(b), 0) / matches.length) / 100;
                                                                    const fv = parseFloat(mandate.amount) * Math.pow(1 + avgRate, parseFloat(mandate.horizon));
                                                                    return (
                                                                        <div className="bg-white px-6 py-5 rounded-[24px] border border-slate-100 shadow-xl min-w-[140px] flex flex-col justify-center">
                                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Est. {mandate.horizon}Y Value</p>
                                                                            <p className="font-black text-emerald-600 text-2xl">{formatINR(fv)}</p>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <p className="text-slate-600 font-bold leading-relaxed text-sm max-w-2xl">{strategy.summary}</p>
                                                    </div>
                                                </div>

                                                {/* Allocation */}
                                                <div className="p-10 bg-white">
                                                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                                        <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Asset Allocation</h5>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">₹{Number(mandate.amount).toLocaleString()}</span>
                                                    </div>

                                                    <div className="space-y-4 mb-10">
                                                        {strategy.allocation.map((asset, aidx) => (
                                                            <div key={aidx} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 hover:bg-white transition-all group">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-black text-slate-900 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                                        {asset.name[0]}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-slate-900 text-base tracking-tight mb-0.5">{asset.displayName}</p>
                                                                        <div className="flex gap-2 items-center text-[10px] font-black uppercase tracking-widest">
                                                                            <span className="text-rose-500">{asset.name}</span>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span className={asset.risk === 'Low' ? 'text-emerald-500' : asset.risk === 'High' ? 'text-rose-500' : 'text-amber-500'}>
                                                                                {asset.risk} Risk
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-black text-slate-900 text-lg mb-0.5">₹{asset.amount.toLocaleString()}</p>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{asset.weight}% Weight</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Market Outlook */}
                                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
                                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Market Outlook & Rationale</h5>
                                                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{strategy.marketOutlook}</p>
                                                    </div>

                                                    {/* Backtest result (from "Run Backtest" on this generated strategy) */}
                                                    {backtestData && (
                                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
                                                            <div className="p-6 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl border border-rose-100">
                                                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-rose-100/50">
                                                                    <History className="w-5 h-5 text-rose-500" />
                                                                    <h5 className="text-[11px] font-black text-rose-900 uppercase tracking-[0.2em]">Historical Backtest Simulation</h5>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                                    <div className="bg-white rounded-xl p-4 border border-rose-50 shadow-sm">
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Simulated T0 Value</p>
                                                                        <p className="font-black text-slate-900 text-xl">₹{backtestData.historicalValue?.toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="bg-white rounded-xl p-4 border border-rose-50 shadow-sm">
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Historical CAGR</p>
                                                                        <p className="font-black text-emerald-600 text-xl">{backtestData.historicalCAGR}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white/50 rounded-xl p-4 border border-rose-50">
                                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">AI Risk & Safety Analysis</p>
                                                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{backtestData.analysis}</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex justify-end gap-4">
                                                        <button
                                                            onClick={runBacktest}
                                                            disabled={backtestLoading}
                                                            className="px-8 py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-3 disabled:opacity-50"
                                                        >
                                                            {backtestLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
                                                            {backtestLoading ? 'Simulating...' : 'Quick Backtest'}
                                                        </button>
                                                        <button
                                                            onClick={() => saveStrategyToDB(strategy)}
                                                            className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 hover:shadow-xl hover:shadow-rose-900/20 hover:-translate-y-1 transition-all flex items-center gap-3"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                            Save to Vault
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="h-full flex flex-col items-center justify-center text-center px-10"
                                            >
                                                <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mb-8 border border-rose-100">
                                                    <Layers className="w-10 h-10 text-rose-300" />
                                                </div>
                                                <h3 className="font-black text-slate-900 text-2xl tracking-tight mb-4">Awaiting Mandate</h3>
                                                <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                                                    Configure your investment parameters on the left and click 'Generate Plan' to architect a custom quantitative portfolio.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </FeatureLock>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AIStrategist;
