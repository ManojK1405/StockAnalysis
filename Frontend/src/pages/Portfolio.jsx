import React, { useState, useEffect, useMemo } from 'react';
import { 
    LayoutDashboard, Plus, Trash2, ArrowUpRight, ArrowDownRight, 
    Briefcase, Activity, Target, ShieldAlert, Zap, Clock, CheckCircle2, 
    AlertCircle, Wallet, Brain, Sparkles, X, Filter, History as HistoryIcon,
    ChevronRight, SkipForward, Play, Pause, Search, Info, TrendingUp, PieChart as PieIcon, ShieldCheck
} from 'lucide-react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import FeatureLock from '../components/feature-lock';
import { toast } from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0f172a', '#ea580c', '#64748b', '#94a3b8', '#cbd5e1'];

const Portfolio = () => {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [tradeQueue, setTradeQueue] = useState([]);
    const [tradeLogs, setTradeLogs] = useState([]);
    const [mockBalance, setMockBalance] = useState(0);
    const [autoPilot, setAutoPilot] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(null);
    const [showModeConfirm, setShowModeConfirm] = useState(false);
    const [mode, setMode] = useState('mock'); 
    const [newItem, setNewItem] = useState({ symbol: '', quantity: '', type: 'BUY' });
    const [topUpAmount, setTopUpAmount] = useState('');
    const [socket, setSocket] = useState(null);
    const [queueTab, setQueueTab] = useState('upcoming'); // upcoming | history

    const [brokerOrders, setBrokerOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('portfolio'); // portfolio | analysis | orders
    const [selectedBroker, setSelectedBroker] = useState('zerodha');
    const [brokerCredentials, setBrokerCredentials] = useState({ apiKey: '', apiSecret: '', requestToken: '' });
    const [showBrokerModal, setShowBrokerModal] = useState(false);
    const [marketOpen, setMarketOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [watchlistRes, portfolioRes, queueRes, logsRes, marketStatusRes, ordersRes] = await Promise.all([
                api.get('/portfolio/watchlist'),
                api.get(`/portfolio/portfolio?mode=${mode}`),
                api.get('/portfolio/queue'),
                api.get('/portfolio/logs'),
                api.get('/market/status'),
                api.get('/portfolio/orders')
            ]);
            setWatchlist(watchlistRes.data);
            setPortfolio(portfolioRes.data.items || []);
            setMockBalance(portfolioRes.data.mockBalance || 0);
            setAutoPilot(portfolioRes.data.autoPilot || false);
            setTradeQueue(queueRes.data);
            setTradeLogs(logsRes.data);
            setBrokerOrders(ordersRes.data || []);
            setMarketOpen(marketStatusRes.data.isOpen);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, [mode]);

    // 1. Stable Socket Connection (Connect Once)
    useEffect(() => {
        if (user?.brokerType) {
            setSelectedBroker(user.brokerType);
        }
    }, [user]);

    useEffect(() => {
        const newSocket = io('http://localhost:5001', {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        
        setSocket(newSocket);
        console.log('🔌 Socket.io: Attempting persistent connection...');

        return () => {
            console.log('🔌 Socket.io: Disconnecting...');
            newSocket.disconnect();
        };
    }, []);

    // 2. Dynamic Subscription Management
    useEffect(() => {
        if (!socket) return;

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const handleConnect = () => {
            const symbols = [
                ...new Set([
                    ...watchlist.map(i => i.stock.symbol.split('.')[0]),
                    ...portfolio.map(i => i.stock.symbol.split('.')[0])
                ])
            ];
            if (symbols.length > 0) {
                console.log('📡 Socket.io: Subscribing to', symbols.length, 'assets');
                socket.emit('subscribe_live_data', { userId, symbols });
            }
        };

        if (socket.connected) {
            handleConnect();
        }

        socket.on('connect', handleConnect);
        
        socket.on('live_ticks', (ticks) => {
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
                    return { ...item, currentPrice: tick.last_price };
                }
                return item;
            }));
        });

        if (user?.id && user?.brokerAccess) {
            socket.emit('subscribe_live_data', { 
                userId: user.id, 
                symbols: portfolio.map(p => p.stock.symbol.split('.')[0]) 
            });
        }

        return () => {
            socket.off('live_ticks');
        };
    }, [socket, user?.id, user?.brokerAccess, portfolio.length]);

    const sectorData = useMemo(() => {
        const sectors = {};
        portfolio.forEach(item => {
            const s = item.stock.sector || 'Others';
            sectors[s] = (sectors[s] || 0) + (item.quantity * item.currentPrice);
        });
        return Object.entries(sectors).map(([name, value]) => ({ name, value }));
    }, [portfolio]);

    const calculateTotalPnL = () => {
        let totalInvested = 0;
        let totalCurrent = 0;
        portfolio.forEach(item => {
            totalInvested += item.totalCost || 0;
            totalCurrent += (item.currentPrice * item.quantity) || item.totalCost || 0;
        });
        const pnl = totalCurrent - totalInvested;
        const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
        return { pnl, pnlPercent, totalCurrent, totalInvested };
    };

    const { pnl: totalPnL, pnlPercent: totalPnLPercent, totalCurrent, totalInvested } = calculateTotalPnL();

    // Data for Charts
    const chartData = useMemo(() => {
        // Generate mock historical data points based on trade logs
        const baseValue = mockBalance + totalCurrent;
        return [
            { time: '09:15', value: baseValue * 0.98 },
            { time: '10:30', value: baseValue * 0.99 },
            { time: '11:45', value: baseValue * 0.985 },
            { time: '13:00', value: baseValue * 1.005 },
            { time: '14:15', value: baseValue * 1.01 },
            { time: '15:30', value: baseValue }
        ];
    }, [mockBalance, totalCurrent]);

    const pieData = useMemo(() => {
        if (portfolio.length === 0) return [{ name: 'Cash', value: mockBalance }];
        const assets = portfolio.map(item => ({
            name: item.stock.symbol,
            value: item.currentPrice * item.quantity
        }));
        return [...assets, { name: 'Cash', value: mockBalance }];
    }, [portfolio, mockBalance]);

    const handleMockOrder = async (e) => {
        e.preventDefault();
        try {
            const symbol = newItem.symbol.toUpperCase().endsWith('.NS') ? newItem.symbol.toUpperCase() : `${newItem.symbol.toUpperCase()}.NS`;
            const quoteRes = await api.get(`/market/quote/${symbol}`);
            const price = quoteRes.data.price;

            if (newItem.type === 'BUY') {
                await api.post('/portfolio/mock/buy', {
                    symbol,
                    quantity: parseFloat(newItem.quantity),
                    price
                });
                toast.success(`Bought ${newItem.quantity} shares of ${symbol}`);
            } else {
                await api.post('/portfolio/mock/sell', {
                    symbol,
                    quantity: parseFloat(newItem.quantity),
                    price
                });
                toast.success(`Sold ${newItem.quantity} shares of ${symbol}`);
            }

            setShowAddModal(false);
            setNewItem({ symbol: '', quantity: '', type: 'BUY' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Order execution failed');
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        try {
            await api.post('/portfolio/mock/balance', { amount: topUpAmount });
            toast.success('Funds added to vault');
            setShowTopUpModal(false);
            setTopUpAmount('');
            fetchData();
        } catch (error) {
            toast.error('Failed to add funds');
        }
    };

    const toggleAI = async () => {
        try {
            const newState = !autoPilot;
            await api.post('/portfolio/autopilot/toggle', { enabled: newState });
            setAutoPilot(newState);
            toast.success(`EquiTrade AI Pilot ${newState ? 'Engaged' : 'Disengaged'}`);
            fetchData();
        } catch (error) {
            toast.error('AI Control Toggle Failed');
        }
    };

    const handleSkipOrder = async (id) => {
        try {
            await api.post(`/portfolio/queue/skip/${id}`);
            toast.success('Order skipped by user');
            fetchData();
        } catch (error) {
            toast.error('Failed to skip order');
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

    const upcomingTrades = tradeQueue.filter(t => t.status === 'PENDING');

    return (
        <div className="bg-[#fcfdfe] min-h-screen p-6 md:p-12 pb-32">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg shadow-orange-600/20">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase underline decoration-orange-600 decoration-4 underline-offset-8">
                                Portfolio <span className="text-premium">Hub</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] pl-1">Institutional Wealth Terminal</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* 1. Mode Toggle */}
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
                            <button 
                                onClick={() => {
                                    if (mode === 'live') setShowModeConfirm(true);
                                }}
                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'mock' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                Mock Deck
                            </button>
                            <button 
                                disabled={!user?.brokerApiKey}
                                onClick={() => {
                                    if (mode === 'mock') setShowModeConfirm(true);
                                }}
                                title={!user?.brokerApiKey ? 'Connect a broker in Settings to enable Live Sync' : ''}
                                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'live' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'} ${!user?.brokerApiKey ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                            >
                                Live Sync
                            </button>
                        </div>

                        {/* 2. Broker Selector (Conditional) */}
                        {mode === 'live' && (
                            <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Broker:</span>
                                <select 
                                    value={selectedBroker}
                                    onChange={(e) => setSelectedBroker(e.target.value)}
                                    className="bg-transparent text-[10px] font-black text-slate-900 uppercase tracking-widest focus:outline-none cursor-pointer"
                                >
                                    <option value="zerodha">Zerodha Kite</option>
                                    <option value="groww">Groww</option>
                                    <option value="dhan">Dhan</option>
                                </select>
                            </div>
                        )}

                        {/* 3. Market Status Indicator */}
                        <div className={`flex items-center gap-4 px-6 py-4 rounded-[24px] border transition-all shadow-sm shrink-0 ${marketOpen ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                            <div className={`w-3 h-3 rounded-full ${marketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                            <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${marketOpen ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    Market {marketOpen ? 'Open' : 'Closed'}
                                </span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">IST 09:15 - 15:30</span>
                            </div>
                        </div>

                        {/* 4. Available Funds Card */}
                        <div className="bg-white border border-slate-200 px-8 py-4 rounded-[24px] shadow-sm flex flex-col justify-center min-w-[200px] shrink-0">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1 flex items-center gap-2">
                                <Wallet className="w-3 h-3 text-orange-600" />
                                Available Funds
                            </p>
                            <div className="flex items-center justify-between">
                                <p className="text-2xl font-black text-slate-900 tracking-tight">₹{mockBalance.toLocaleString()}</p>
                                {mode === 'mock' && (
                                    <button onClick={() => setShowTopUpModal(true)} className="p-2 bg-orange-50 hover:bg-orange-600 hover:text-white rounded-full text-orange-600 transition-all active:scale-90 shadow-sm">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 5. AI Pilot Button */}
                        <button 
                            onClick={toggleAI}
                            className={`px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-4 shadow-xl active:scale-95 shrink-0 ${autoPilot ? 'bg-orange-600 text-white shadow-orange-500/30' : 'bg-slate-900 text-white shadow-slate-900/30'}`}
                        >
                            <div className={`p-1 rounded-full ${autoPilot ? 'bg-white text-orange-600 animate-pulse shadow-inner' : 'bg-orange-600 text-white'}`}>
                                <Zap className="w-4 h-4 fill-current" />
                            </div>
                            {autoPilot ? 'AI Pilot Engaged' : 'Engage EquiTrade'}
                        </button>
                    </div>
                </header>

                <FeatureLock featureName="Portfolio Hub" description="Unlock real-time portfolio tracking, AI risk analysis, and multi-broker execution.">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-10">
                            
                            {/* Performance Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        Total AUM
                                    </p>
                                    <p className="text-3xl font-black text-slate-900">₹{(mockBalance + totalCurrent).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">Vault + Market Value</p>
                                </div>
                                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                        Net Unrealized P&L
                                    </p>
                                    <p className={`text-3xl font-black ${totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {totalPnL >= 0 ? '+' : '-'}₹{Math.abs(totalPnL).toLocaleString()}
                                    </p>
                                    <p className={`text-[10px] font-bold mt-2 ${totalPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{totalPnLPercent.toFixed(2)}% ROI</p>
                                </div>
                                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Target className="w-3 h-3 text-orange-500" />
                                        Capital Deployed
                                    </p>
                                    <p className="text-3xl font-black text-slate-900">₹{totalInvested.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2">{((totalInvested/(mockBalance + totalInvested))*100).toFixed(1)}% Allocation</p>
                                </div>
                            </div>


                            {/* Holdings Table */}
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                                <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-5">
                                            <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
                                                <LayoutDashboard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">EquiSense Vault</h2>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Managed Assets</p>
                                            </div>
                                        </div>
                                        
                                        <div className="h-10 w-[1px] bg-slate-100 hidden md:block" />
                                        
                                        <div className="flex items-center bg-slate-50 p-1 rounded-2xl">
                                            <button 
                                                onClick={() => setActiveTab('portfolio')}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'portfolio' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Portfolio
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('analysis')}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Analysis
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('orders')}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Audit Trail
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {activeTab === 'portfolio' && (
                                            <button 
                                                onClick={() => setShowAddModal(true)}
                                                className="flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-600/20 transition-all active:scale-95 shadow-lg"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Open Position
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="overflow-x-auto min-h-[400px]">
                                    {activeTab === 'portfolio' && (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/40">
                                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Identification</th>
                                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume</th>
                                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Entry / Live Spot</th>
                                                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Profit Analysis</th>
                                                    <th className="p-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                            {portfolio.map((item) => (
                                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-slate-900/10 group-hover:scale-105 transition-transform">
                                                                {item.stock.symbol[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 text-xl tracking-tighter">{item.stock.symbol}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.stock.sector || 'EQUITY'}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">NSE</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right font-black text-slate-700 text-xl">
                                                        {item.quantity.toLocaleString()}
                                                        <span className="block text-[9px] text-slate-300 font-black tracking-widest mt-1">UNITS</span>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <p className="font-black text-slate-900 text-xl">₹{item.avgPrice.toLocaleString()}</p>
                                                        <div className="flex items-center justify-end gap-2 mt-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                                                            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase italic">Live: ₹{item.currentPrice?.toLocaleString() || '--'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <div className={`inline-flex items-center gap-2 font-black text-2xl tracking-tighter ${item.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {item.pnl >= 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                                                            ₹{Math.abs(item.pnl || 0).toLocaleString()}
                                                        </div>
                                                        <p className={`text-[10px] font-black mt-1 tracking-widest uppercase px-3 py-1 rounded-lg inline-block ml-auto ${item.pnl >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {item.pnlPercent?.toFixed(2)}%
                                                        </p>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <button 
                                                            onClick={() => {
                                                                setNewItem({ symbol: item.stock.symbol, quantity: item.quantity, type: 'SELL' });
                                                                setShowAddModal(true);
                                                            }}
                                                            className="p-4 bg-slate-50 hover:bg-rose-600 hover:text-white text-slate-300 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {portfolio.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="p-32 text-center">
                                                        <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                                            <Briefcase className="w-10 h-10 text-slate-200" />
                                                        </div>
                                                        <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Vault Liquidity High • No Positions</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                    {activeTab === 'analysis' && (
                                        <div className="p-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="bg-slate-50/50 p-10 rounded-[40px] border border-slate-100">
                                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
                                                        <PieIcon className="w-4 h-4 text-orange-500" />
                                                        Sector Diversification
                                                    </h3>
                                                    <div className="h-[300px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={sectorData}
                                                                    innerRadius={80}
                                                                    outerRadius={110}
                                                                    paddingAngle={8}
                                                                    dataKey="value"
                                                                >
                                                                    {sectorData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={['#0f172a', '#ea580c', '#64748b', '#94a3b8'][index % 4]} stroke="none" />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip 
                                                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                                                    itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col justify-center gap-4">
                                                    {sectorData.map((s, idx) => (
                                                        <div key={s.name} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#0f172a', '#ea580c', '#64748b', '#94a3b8'][idx % 4] }} />
                                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{s.name}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-400">₹{s.value.toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'orders' && (
                                        <div className="p-0">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50/40 border-b border-slate-50">
                                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Volume</th>
                                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Execution Price</th>
                                                        <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {brokerOrders.map((order) => (
                                                        <tr key={order.order_id} className="hover:bg-slate-50/50 transition-all">
                                                            <td className="p-8">
                                                                <p className="font-black text-slate-900 text-lg uppercase tracking-tight">{order.tradingsymbol}</p>
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{order.order_timestamp}</p>
                                                            </td>
                                                            <td className="p-8 text-right font-black text-slate-700">{order.quantity}</td>
                                                            <td className="p-8 text-right font-black text-slate-900">₹{order.average_price.toLocaleString()}</td>
                                                            <td className="p-8 text-right">
                                                                <span className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest ${order.status === 'COMPLETE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {brokerOrders.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="p-20 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">No order history available</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-10 lg:sticky lg:top-24 lg:self-start">
                            
                            {/* Asset Distribution */}
                            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                                        <PieIcon className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Distribution</h2>
                                </div>
                                <div className="h-[200px] min-h-[200px] w-full mb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3">
                                    {pieData.map((d, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900 tracking-tighter">₹{d.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Execution & History Queue */}
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                            <Zap className="w-6 h-6 fill-current" />
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Audit Trail</h2>
                                    </div>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                        <button 
                                            onClick={() => setQueueTab('upcoming')}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${queueTab === 'upcoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            <Clock className="w-3.5 h-3.5" />
                                            Plan
                                        </button>
                                        <button 
                                            onClick={() => setQueueTab('history')}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${queueTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            <HistoryIcon className="w-3.5 h-3.5" />
                                            History
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-8 space-y-6 flex-1 overflow-y-auto max-h-[700px] scrollbar-hide">
                                    {queueTab === 'upcoming' ? (
                                        upcomingTrades.map((trade) => (
                                            <div key={trade.id} className="p-7 rounded-[32px] bg-slate-50 border border-slate-100 group relative hover:border-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${trade.trades?.[0]?.action === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                                {trade.trades?.[0]?.action || 'AUTO'}
                                                            </span>
                                                            <span className="text-base font-black text-slate-900 tracking-tighter">{trade.trades?.[0]?.symbol || 'UNKNOWN'}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                            <Brain className="w-3.5 h-3.5 text-indigo-500" />
                                                            {trade.status} Transmission
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleSkipOrder(trade.id)}
                                                            className="p-3 bg-white rounded-xl text-slate-400 hover:text-amber-600 shadow-sm transition-all hover:scale-110 border border-slate-100"
                                                            title="Skip Execution"
                                                        >
                                                            <SkipForward className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDismissTrade(trade.id)}
                                                            className="p-3 bg-white rounded-xl text-slate-400 hover:text-rose-600 shadow-sm transition-all hover:scale-110 border border-slate-100"
                                                            title="Purge Plan"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Value: <span className="text-slate-900">₹{trade.trades?.[0]?.amount?.toLocaleString() || '0'}</span>
                                                    </div>
                                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95">
                                                        <Play className="w-3 h-3 fill-current" />
                                                        Execute Now
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        tradeLogs.map((log) => (
                                            <div 
                                                key={log.id} 
                                                className="p-6 rounded-[32px] bg-white border border-slate-50 hover:border-slate-200 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                                onClick={() => setShowDetailModal(log)}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${log.action === 'BUY' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                            {log.action[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 tracking-tight">{log.symbol}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black text-slate-900">₹{log.price.toLocaleString()}</p>
                                                        <p className={`text-[9px] font-bold uppercase tracking-widest ${log.mode === 'AI_PILOT' ? 'text-orange-500' : 'text-indigo-500'}`}>
                                                            {log.mode.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex -space-x-1">
                                                        <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center">
                                                            <Info className="w-2.5 h-2.5 text-slate-400" />
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {((queueTab === 'upcoming' && upcomingTrades.length === 0) || (queueTab === 'history' && tradeLogs.length === 0)) && (
                                        <div className="text-center py-24">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <HistoryIcon className="w-8 h-8 text-slate-100" />
                                            </div>
                                            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest italic">Intelligence Log Vacant</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Watchlist */}
                            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">High-Alpha Watch</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidates for AI Rotation</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {watchlist.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-6 rounded-[32px] bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:border-orange-200">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center font-black text-slate-900 text-lg shadow-sm border border-slate-50 transition-transform group-hover:scale-105">
                                                    {item.stock.symbol[0]}
                                                </div>
                                                <div>
                                                    <span className="font-black text-slate-900 text-base tracking-tight">{item.stock.symbol}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] text-slate-400 font-black tracking-widest uppercase">NSE</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className="text-[9px] text-emerald-500 font-black tracking-widest uppercase">+1.2%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="p-3 bg-white shadow-sm rounded-xl text-slate-200 hover:text-orange-600 hover:border-orange-100 border border-transparent transition-all opacity-0 group-hover:opacity-100 hover:scale-110">
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </FeatureLock>
            </div>

            {/* Log Detail Modal */}
            <AnimatePresence>
                {showDetailModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-xl rounded-[48px] overflow-hidden shadow-2xl relative border border-white/20">
                            <button onClick={() => setShowDetailModal(null)} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all z-20">
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className={`p-12 text-white relative ${showDetailModal.action === 'BUY' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-4 bg-white/20 rounded-[24px] backdrop-blur-md">
                                            <Brain className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black italic tracking-tighter uppercase">AI Decision Report</h3>
                                            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Institutional Audit Trail</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Asset Identification</p>
                                            <p className="text-2xl font-black">{showDetailModal.symbol}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Timestamp</p>
                                            <p className="text-xl font-black">{new Date(showDetailModal.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-12 space-y-10">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Action</p>
                                        <p className={`text-xl font-black uppercase ${showDetailModal.action === 'BUY' ? 'text-emerald-600' : 'text-rose-600'}`}>{showDetailModal.action}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Volume</p>
                                        <p className="text-xl font-black text-slate-900">{showDetailModal.quantity}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Price</p>
                                        <p className="text-xl font-black text-slate-900">₹{showDetailModal.price.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-orange-500" />
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">AI Logic Reasoning</h4>
                                    </div>
                                    <div className="p-8 bg-orange-50 rounded-[32px] border border-orange-100/50">
                                        <p className="text-slate-700 font-bold leading-relaxed italic text-lg">
                                            "{showDetailModal.reason || 'Technical sentiment analysis indicated a high-probability breakout setup with a positive correlation to sector momentum.'}"
                                        </p>
                                    </div>
                                </div>

                                <button onClick={() => setShowDetailModal(null)} className="w-full py-6 rounded-[32px] bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl">
                                    Acknowledge Decision
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Top Up Modal */}
                {showTopUpModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 w-full max-w-md rounded-[48px] shadow-2xl relative border border-slate-200">
                            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase italic tracking-tighter underline decoration-orange-600 decoration-4">Injection Protocol</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-8">Add Mock Funds to Vault</p>
                            
                            <form onSubmit={handleTopUp} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capital Amount (INR)</label>
                                    <input 
                                        type="number" 
                                        placeholder="E.g. 500000" 
                                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-3xl font-black focus:outline-none focus:border-orange-600/30 transition-all" 
                                        value={topUpAmount}
                                        onChange={(e) => setTopUpAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setShowTopUpModal(false)} className="flex-1 p-6 rounded-3xl border border-slate-100 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors">Abort</button>
                                    <button type="submit" className="flex-1 p-6 rounded-3xl bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl">Inject Capital</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Add/Trade Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white p-10 w-full max-w-lg rounded-[48px] shadow-2xl relative border border-slate-200"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className={`p-4 rounded-[20px] text-white ${newItem.type === 'BUY' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase italic">Secure Transmission</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Executing {newItem.type} Order</p>
                                </div>
                            </div>

                            <form onSubmit={handleMockOrder} className="space-y-6">
                                <div className="flex bg-slate-100 p-1.5 rounded-[20px] mb-6">
                                    <button 
                                        type="button"
                                        onClick={() => setNewItem({...newItem, type: 'BUY'})}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${newItem.type === 'BUY' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Buy Signal
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setNewItem({...newItem, type: 'SELL'})}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${newItem.type === 'SELL' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        Sell Signal
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Identification</label>
                                    <input 
                                        type="text" 
                                        placeholder="E.g. RELIANCE" 
                                        className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black focus:outline-none focus:ring-4 focus:ring-orange-600/5 focus:border-orange-600/30 transition-all uppercase" 
                                        value={newItem.symbol}
                                        onChange={(e) => setNewItem({...newItem, symbol: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Share Quantity</label>
                                    <input type="number" placeholder="00" className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black focus:outline-none border-slate-100 focus:border-orange-600/30 transition-all" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} />
                                </div>
                                
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-6 rounded-3xl border border-slate-100 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors">Abort</button>
                                    <button type="submit" className={`flex-1 p-6 rounded-3xl text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${newItem.type === 'BUY' ? 'bg-emerald-600 shadow-emerald-900/10' : 'bg-rose-600 shadow-rose-900/10'}`}>
                                        Transmit {newItem.type}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
                                {showModeConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setShowModeConfirm(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-12 text-center">
                                {mode === 'mock' ? (
                                    <>
                                        <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-inner">
                                            <ShieldCheck className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase mb-4">Engage Live Sync?</h3>
                                        <p className="text-slate-500 font-medium leading-relaxed mb-10">
                                            You are about to switch from the <span className="text-orange-600 font-bold uppercase tracking-widest text-[10px]">Mock Environment</span> to <span className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">Live Production</span>. 
                                            All trades executed in this mode will involve real capital through your connected broker.
                                        </p>
                                        <div className="flex flex-col gap-4">
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const res = await api.post('/portfolio/sync-broker', { 
                                                            brokerType: selectedBroker,
                                                            apiKey: 'PERSISTED_IN_DB' 
                                                        });
                                                        if (res.data.loginUrl) {
                                                            const isExpired = !!user?.brokerAccess;
                                                            toast.error(isExpired ? 'Session Expired. Please reconnect in Settings.' : 'Broker not authorized. Please visit Settings.');
                                                            setShowModeConfirm(false);
                                                            return;
                                                        }
                                                        if (res.data.synced >= 0) {
                                                            setMode('live');
                                                            setShowModeConfirm(false);
                                                            fetchData();
                                                            toast.success(`${selectedBroker.toUpperCase()} Sync Successful`);
                                                        }
                                                    } catch (err) {
                                                        setShowModeConfirm(false);
                                                        toast.error(!user?.brokerApiKey ? 'Broker Not Configured. Please visit Settings.' : 'Handshake Failed. Re-authenticate in Settings.');
                                                    }
                                                }}
                                                className="w-full py-6 bg-emerald-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-95"
                                            >
                                                Activate Production Mode
                                            </button>
                                            <button onClick={() => setShowModeConfirm(false)} className="w-full py-6 bg-slate-50 text-slate-400 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-all">Stay in Mock Deck</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 bg-orange-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-orange-600 shadow-inner">
                                            <ShieldAlert className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase mb-4">Enter Simulation?</h3>
                                        <p className="text-slate-500 font-medium leading-relaxed mb-10">
                                            You are reverting to the <span className="text-orange-600 font-bold uppercase tracking-widest text-[10px]">Mock Environment</span>. 
                                            Live broker synchronization will be suspended. All trades will use virtual balance.
                                        </p>
                                        <div className="flex flex-col gap-4">
                                            <button 
                                                onClick={() => {
                                                    setMode('mock');
                                                    setShowModeConfirm(false);
                                                    fetchData();
                                                    toast.success('Simulation Mode Engaged');
                                                }}
                                                className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:bg-orange-600 transition-all active:scale-95"
                                            >
                                                Switch to Mock Deck
                                            </button>
                                            <button onClick={() => setShowModeConfirm(false)} className="w-full py-6 bg-slate-50 text-slate-400 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-all">Stay in Live Sync</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Broker Credentials Modal */}
                {showBrokerModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => setShowBrokerModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="relative bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-12">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-white">
                                            <ShieldAlert className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Connect {selectedBroker}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Broker Handshake</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowBrokerModal(false)} className="p-4 bg-slate-50 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:outline-none focus:border-orange-600/30 transition-all" 
                                            value={brokerCredentials.apiKey}
                                            onChange={(e) => setBrokerCredentials({...brokerCredentials, apiKey: e.target.value})}
                                            placeholder="Enter your broker API key"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Secret / Password</label>
                                        <input 
                                            type="password" 
                                            className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:outline-none focus:border-orange-600/30 transition-all" 
                                            value={brokerCredentials.apiSecret}
                                            onChange={(e) => setBrokerCredentials({...brokerCredentials, apiSecret: e.target.value})}
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                    {selectedBroker === 'zerodha' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Request Token</label>
                                            <input 
                                                type="text" 
                                                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:outline-none focus:border-orange-600/30 transition-all" 
                                                value={brokerCredentials.requestToken}
                                                onChange={(e) => setBrokerCredentials({...brokerCredentials, requestToken: e.target.value})}
                                                placeholder="Enter fresh Request Token"
                                            />
                                        </div>
                                    )}

                                    <button 
                                        onClick={async () => {
                                            try {
                                                const res = await api.post('/portfolio/sync-broker', {
                                                    brokerType: selectedBroker,
                                                    apiKey: brokerCredentials.apiKey,
                                                    apiSecret: brokerCredentials.apiSecret,
                                                    requestToken: brokerCredentials.requestToken
                                                });
                                                if (res.data.synced >= 0) {
                                                    setMode('live');
                                                    setShowBrokerModal(false);
                                                    setBrokerCredentials(prev => ({ ...prev, requestToken: '' })); // Clear temporary token
                                                    fetchData();
                                                    toast.success('Live Broker Connected & Synced');
                                                }
                                            } catch (err) {
                                                toast.error(err.response?.data?.error || 'Sync Failed. Verify credentials.');
                                            }
                                        }}
                                        className="w-full py-6 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all active:scale-95"
                                    >
                                        Establish Live Connection
                                    </button>
                                    
                                    <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                        Your credentials are encrypted and never stored in plain text. <br/> Connections are handled via official broker APIs only.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Portfolio;
