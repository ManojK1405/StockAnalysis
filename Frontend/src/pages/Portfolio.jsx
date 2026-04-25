import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, Plus, Trash2, ArrowUpRight, ArrowDownRight, 
    Briefcase, Activity, Target, ShieldAlert, Zap, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import FeatureLock from '../components/feature-lock';

const Portfolio = () => {
    const [watchlist, setWatchlist] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [tradeQueue, setTradeQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [mode, setMode] = useState('mock'); 
    const [newItem, setNewItem] = useState({ symbol: '', quantity: '', avgPrice: '' });
    const [socket, setSocket] = useState(null);
    const [riskInsights, setRiskInsights] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [watchlistRes, portfolioRes, queueRes] = await Promise.all([
                api.get('/portfolio/watchlist'),
                api.get(`/portfolio/portfolio?mode=${mode}`),
                api.get('/portfolio/queue')
            ]);
            setWatchlist(watchlistRes.data);
            setPortfolio(portfolioRes.data);
            setTradeQueue(queueRes.data);
            
            // Generate mock risk insights based on portfolio
            generateRiskInsights(portfolioRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateRiskInsights = (data) => {
        if (data.length === 0) {
            setRiskInsights({
                status: 'Neutral',
                score: 50,
                message: 'Add assets to generate your institutional risk profile.',
                highlights: []
            });
            return;
        }
        
        const totalPnL = data.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
        const pnlStatus = totalPnL >= 0 ? 'Aggressive' : 'Defensive';
        
        setRiskInsights({
            status: pnlStatus,
            score: totalPnL >= 0 ? 78 : 42,
            message: totalPnL >= 0 
                ? 'Your portfolio is currently showing high momentum. Consider trailing stop-losses to protect alpha.' 
                : 'Current exposure is underperforming. Analyzing sector rotation opportunities.',
            highlights: [
                { type: 'warning', text: 'High concentration in IT sector detected.' },
                { type: 'success', text: 'Volatility remains within institutional limits.' }
            ]
        });
    };

    useEffect(() => {
        fetchData();
    }, [mode]);

    useEffect(() => {
        const newSocket = io('http://localhost:5001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            const userId = localStorage.getItem('userId');
            if (userId) {
                const symbols = [
                    ...new Set([
                        ...watchlist.map(i => i.stock.symbol.split('.')[0]),
                        ...portfolio.map(i => i.stock.symbol.split('.')[0])
                    ])
                ];
                newSocket.emit('subscribe_live_data', { userId, symbols });
            }
        });

        newSocket.on('live_ticks', (ticks) => {
            setPortfolio(prev => prev.map(item => {
                const tick = ticks.find(t => t.tradingsymbol === item.stock.symbol.split('.')[0]);
                if (tick) {
                    const currentVal = tick.last_price * item.quantity;
                    const pnl = currentVal - item.totalCost;
                    return { 
                        ...item, 
                        currentPrice: tick.last_price,
                        pnl: pnl,
                        pnlPercent: (pnl / item.totalCost) * 100
                    };
                }
                return item;
            }));
        });

        return () => newSocket.disconnect();
    }, [watchlist.length, portfolio.length]);

    const handleAddPortfolio = async (e) => {
        e.preventDefault();
        try {
            await api.post('/portfolio/portfolio', {
                symbol: newItem.symbol.toUpperCase().endsWith('.NS') ? newItem.symbol.toUpperCase() : `${newItem.symbol.toUpperCase()}.NS`,
                quantity: parseFloat(newItem.quantity),
                avgPrice: parseFloat(newItem.avgPrice)
            });
            setShowAddModal(false);
            setNewItem({ symbol: '', quantity: '', avgPrice: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding portfolio item:', error);
        }
    };

    const handleDeleteHolding = async (id) => {
        try {
            await api.delete(`/portfolio/portfolio/${id}`);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDismissTrade = async (id) => {
        try {
            await api.delete(`/portfolio/queue/${id}`);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const calculateTotalPnL = () => {
        let totalInvested = 0;
        let totalCurrent = 0;
        portfolio.forEach(item => {
            totalInvested += item.totalCost || 0;
            totalCurrent += (item.currentPrice * item.quantity) || item.totalCost || 0;
        });
        const pnl = totalCurrent - totalInvested;
        const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
        return { pnl, pnlPercent, totalCurrent };
    };

    const { pnl: totalPnL, pnlPercent: totalPnLPercent, totalCurrent } = calculateTotalPnL();

    return (
        <div className="bg-[#fcfdfe] min-h-screen p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-orange-600 p-2 rounded-xl text-white">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-orange-600 decoration-4 underline-offset-8">
                                Portfolio <span className="text-premium">Hub</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Institutional Wealth Terminal</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setMode('mock')}
                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'mock' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Mock Deck
                            </button>
                            <button 
                                onClick={() => setMode('live')}
                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'live' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                                Live Sync
                            </button>
                        </div>

                        <div className="bg-white border border-slate-200 px-8 py-4 rounded-[24px] shadow-sm">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">AUM Value</p>
                            <p className="text-2xl font-black text-slate-900">₹{totalCurrent.toLocaleString()}</p>
                        </div>

                        {mode === 'mock' && (
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="btn text-white px-8 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Add Holding
                            </button>
                        )}
                    </div>
                </header>

                <FeatureLock featureName="Portfolio Hub" description="Unlock real-time portfolio tracking, AI risk analysis, and multi-broker execution.">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-10">
                            
                            {/* AI Risk Insights Card */}
                            {riskInsights && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 blur-[100px] rounded-full -mr-48 -mt-48 transition-transform group-hover:scale-110 duration-1000" />
                                    
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                                    <ShieldAlert className="w-6 h-6 text-orange-500" />
                                                </div>
                                                <h3 className="text-xl font-black italic tracking-tight uppercase italic">Institutional Risk Analysis</h3>
                                            </div>
                                            <p className="text-slate-400 text-lg leading-relaxed mb-8 font-medium">
                                                {riskInsights.message}
                                            </p>
                                            <div className="flex flex-wrap gap-4">
                                                {riskInsights.highlights.map((h, i) => (
                                                    <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${h.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                        {h.type === 'warning' ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                                        {h.text}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="text-center bg-white/5 p-8 rounded-[32px] backdrop-blur-xl border border-white/10 min-w-[160px]">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Alpha Score</p>
                                            <p className="text-5xl font-black text-orange-500">{riskInsights.score}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{riskInsights.status}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Holdings Table */}
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-8 md:p-10 border-b border-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-orange-50 rounded-2xl">
                                            <LayoutDashboard className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase italic">Active Holdings</h2>
                                    </div>
                                    <div className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest ${totalPnL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% Total Return
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Identification</th>
                                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quantity</th>
                                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Entry / Live</th>
                                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unrealized P&L</th>
                                                <th className="p-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {portfolio.map((item) => (
                                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-slate-900/10">
                                                                {item.stock.symbol[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-lg tracking-tight">{item.stock.symbol}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{item.stock.sector || 'EQUITY ASSET'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right font-black text-slate-700 text-lg">
                                                        {item.quantity.toLocaleString()}
                                                        <span className="block text-[8px] text-slate-300 font-black tracking-widest mt-1">SHARES</span>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <p className="font-black text-slate-900 text-lg">₹{item.avgPrice.toLocaleString()}</p>
                                                        <p className="text-[10px] text-orange-500 font-black mt-1 tracking-widest uppercase">Live: ₹{item.currentPrice?.toLocaleString() || '--'}</p>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <div className={`inline-flex items-center gap-2 font-black text-xl tracking-tighter ${item.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {item.pnl >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                                            ₹{Math.abs(item.pnl || 0).toLocaleString()}
                                                        </div>
                                                        <p className={`text-[10px] font-bold mt-1 tracking-widest uppercase ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {item.pnlPercent?.toFixed(2)}%
                                                        </p>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <button 
                                                            onClick={() => handleDeleteHolding(item.id)}
                                                            className="p-3 rounded-xl hover:bg-rose-50 text-slate-200 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {portfolio.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="p-20 text-center">
                                                        <Briefcase className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                                                        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">No positions detected in this vault</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-10">
                            
                            {/* Trade Execution Queue */}
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl">
                                            <Zap className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase italic">Execution Queue</h2>
                                    </div>
                                    {tradeQueue.length > 0 && <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />}
                                </div>
                                
                                <div className="space-y-4">
                                    {tradeQueue.map((trade) => (
                                        <div key={trade.id} className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${trade.type === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                            {trade.type}
                                                        </span>
                                                        <span className="text-sm font-black text-slate-900">{trade.symbol}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{trade.strategyName || 'AI Strategy'}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDismissTrade(trade.id)}
                                                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Pending Approval
                                                </div>
                                                <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors">
                                                    Execute
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {tradeQueue.length === 0 && (
                                        <div className="text-center py-10">
                                            <Clock className="w-10 h-10 text-slate-100 mx-auto mb-4" />
                                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">No pending transmissions</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Watchlist */}
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-orange-50 rounded-2xl">
                                        <Target className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase italic">Intelligence Watch</h2>
                                </div>
                                <div className="space-y-4">
                                    {watchlist.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-6 rounded-[24px] bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center font-black text-slate-900 text-sm shadow-sm border border-slate-50">
                                                    {item.stock.symbol[0]}
                                                </div>
                                                <div>
                                                    <span className="font-black text-slate-900 text-sm tracking-tight">{item.stock.symbol}</span>
                                                    <p className="text-[8px] text-slate-400 font-black tracking-widest uppercase mt-0.5">{item.stock.exchange || 'NSE'}</p>
                                                </div>
                                            </div>
                                            <button className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </FeatureLock>
            </div>

            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white p-10 w-full max-w-lg rounded-[48px] shadow-2xl relative border border-slate-200"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-orange-600 rounded-[20px] text-white">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase italic">Secure Entry</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Log Manual Position</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddPortfolio} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Symbol</label>
                                    <input 
                                        type="text" 
                                        placeholder="E.g. RELIANCE" 
                                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600/30 transition-all uppercase" 
                                        value={newItem.symbol}
                                        onChange={(e) => setNewItem({...newItem, symbol: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                        <input type="number" placeholder="00" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black focus:outline-none focus:border-orange-600/30 transition-all" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Avg Price</label>
                                        <input type="number" step="0.01" placeholder="0.00" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black focus:outline-none focus:border-orange-600/30 transition-all" value={newItem.avgPrice} onChange={(e) => setNewItem({...newItem, avgPrice: e.target.value})} />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-6 rounded-3xl border border-slate-100 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 p-6 rounded-3xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10">Confirm Entry</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Portfolio;
