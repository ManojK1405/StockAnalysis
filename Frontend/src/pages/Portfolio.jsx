import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Plus, Trash2, ArrowUpRight, ArrowDownRight, Briefcase, Activity, Target } from 'lucide-react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const Portfolio = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [mode, setMode] = useState('mock'); 
  const [selectedBroker, setSelectedBroker] = useState(localStorage.getItem('broker_type') || 'zerodha');
  const [brokerKey, setBrokerKey] = useState(localStorage.getItem('broker_api_key') || '');
  const [brokerSecret, setBrokerSecret] = useState(localStorage.getItem('broker_api_secret') || '');
  const [zerodhaRequestToken, setZerodhaRequestToken] = useState('');
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [newItem, setNewItem] = useState({ symbol: '', quantity: '', avgPrice: '' });
  const [socket, setSocket] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [watchlistRes, portfolioRes] = await Promise.all([
        api.get('/portfolio/watchlist'),
        api.get(`/portfolio/portfolio?mode=${mode}`)
      ]);
      setWatchlist(watchlistRes.data);
      setPortfolio(portfolioRes.data);

      if (mode === 'live' && portfolioRes.data.some(p => p.type === 'live')) {
          setIsBrokerConnected(true);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
                return { 
                    ...item, 
                    currentPrice: tick.last_price,
                    pnl: (tick.last_price * item.quantity) - item.totalCost,
                    pnlPercent: (((tick.last_price * item.quantity) - item.totalCost) / item.totalCost) * 100
                };
            }
            return item;
        }));
    });

    return () => newSocket.disconnect();
  }, [watchlist.length, portfolio.length]);

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

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    try {
      await api.post('/portfolio/portfolio', {
        symbol: newItem.symbol.toUpperCase().endsWith('.NS') || newItem.symbol.toUpperCase().endsWith('.BO') ? newItem.symbol.toUpperCase() : `${newItem.symbol.toUpperCase()}.NS`,
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

  const { pnl: totalPnL, pnlPercent: totalPnLPercent, totalCurrent } = calculateTotalPnL();

  return (
    <div className="bg-[#f8fafc] min-h-screen p-8 lg:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <Briefcase className="w-10 h-10 text-blue-600" />
              Portfolio Hub
            </h1>
            <p className="mt-2 text-slate-500 font-medium">Manage your equity vault and live positions</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
               <button 
                 onClick={() => setMode('mock')}
                 className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${mode === 'mock' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 Mock Deck
               </button>
               <button 
                 onClick={() => setMode('live')}
                 className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${mode === 'live' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                 Live Broker
               </button>
             </div>

             <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Net Value</p>
                <p className="text-xl font-bold text-slate-900">₹{totalCurrent.toLocaleString()}</p>
             </div>

             {mode === 'mock' && (
               <button 
                 onClick={() => setShowAddModal(true)}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2"
               >
                 <Plus className="w-5 h-5" />
                 Log Trade
               </button>
             )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                           <LayoutDashboard className="w-5 h-5 text-blue-600" />
                           Holdings
                        </h2>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${totalPnL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {totalPnLPercent.toFixed(2)}%
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Avg Entry</th>
                                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Live P&L</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {portfolio.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600">
                                                {item.stock.symbol[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{item.stock.symbol}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Equity</p>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right font-bold text-slate-700">{item.quantity}</td>
                                        <td className="p-6 text-right">
                                            <p className="font-bold text-slate-900">₹{item.avgPrice.toFixed(2)}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-1">Live: ₹{item.currentPrice?.toFixed(2) || '--'}</p>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className={`inline-flex items-center gap-1 font-bold ${item.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {item.pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                ₹{Math.abs(item.pnl || 0).toFixed(0)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4">
                <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                        <Target className="w-5 h-5 text-blue-600" />
                        Watchlist
                    </h2>
                    <div className="space-y-4">
                        {watchlist.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-slate-400 text-xs shadow-sm">
                                        {item.stock.symbol[0]}
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">{item.stock.symbol}</span>
                                </div>
                                <button className="text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 w-full max-w-md rounded-[32px] shadow-2xl relative border border-slate-200">
              <h3 className="text-xl font-bold mb-6 text-slate-900">Add New Position</h3>
              <form onSubmit={handleAddPortfolio} className="space-y-4">
                <input 
                    type="text" 
                    placeholder="Symbol (e.g. RELIANCE)" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-blue-500" 
                    value={newItem.symbol}
                    onChange={(e) => setNewItem({...newItem, symbol: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Qty" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} />
                    <input type="number" step="0.01" placeholder="Avg Price" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" value={newItem.avgPrice} onChange={(e) => setNewItem({...newItem, avgPrice: e.target.value})} />
                </div>
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 p-4 rounded-2xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 p-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg">Confirm</button>
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
