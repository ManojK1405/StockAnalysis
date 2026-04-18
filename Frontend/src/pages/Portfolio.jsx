import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Plus, Trash2, ArrowUpRight, ArrowDownRight, Briefcase, Bookmark, Activity } from 'lucide-react';
import * as api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const Portfolio = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState('zerodha');
  const [brokerKey, setBrokerKey] = useState('');
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [newItem, setNewItem] = useState({ symbol: '', quantity: '', avgPrice: '' });

  const fetchData = async () => {
    try {
      const [watchlistRes, portfolioRes] = await Promise.all([
        api.getWatchlist(),
        api.getPortfolio()
      ]);
      setWatchlist(watchlistRes.data);
      setPortfolio(portfolioRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    try {
      await api.addPortfolioItem({
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

  const handleConnectBroker = async (e) => {
    e.preventDefault();
    if (!brokerKey) return;
    
    setShowBrokerModal(false);
    setLoading(true);
    
    try {
      await api.syncBroker({
        brokerName: selectedBroker,
        apiKey: brokerKey
      });
      setIsBrokerConnected(true);
      localStorage.setItem('broker_api_key', brokerKey);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to connect to broker. Please check your API key.');
      setLoading(false);
    }
  };

  const handleRemoveWatchlist = async (id) => {
    try {
      await api.removeFromWatchlist(id);
      fetchData();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
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
  const isPositivePortfolio = totalPnL >= 0;

  return (
    <div className="relative min-h-[calc(100vh-2rem)] bg-[#03060b] text-slate-200 overflow-hidden m-4 rounded-[40px] shadow-2xl border border-white/5 font-outfit">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[180px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 p-8 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-blue-400" />
              Portfolio Hub
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">Track Live Equity Positions & Profits</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Total Vault Value</p>
                <p className="text-xl font-black text-white">₹{totalCurrent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
             </div>
             
             {isBrokerConnected ? (
               <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 Live: {selectedBroker === 'zerodha' ? 'Kite Connect' : 'Groww API'}
               </div>
             ) : (
               <button 
                 onClick={() => setShowBrokerModal(true)}
                 className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-4 rounded-2xl font-bold transition-all"
               >
                 <Activity className="w-5 h-5 text-fuchsia-400" />
                 Connect Broker
               </button>
             )}

             <button 
               onClick={() => setShowAddModal(true)}
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
             >
               <Plus className="w-5 h-5" />
               Log Position
             </button>
          </div>
        </header>

        {loading ? (
             <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 border-t-2 border-blue-400 rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
                  <Activity className="w-8 h-8 text-blue-400 absolute inset-0 m-auto" />
                </div>
                <h2 className="text-lg font-black tracking-widest uppercase text-white animate-pulse">Syncing Portfolio State</h2>
             </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Portfolio Section */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-full">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                   <h2 className="text-xl font-black text-white flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 text-blue-400" />
                      Active Fleet
                   </h2>
                   {portfolio.length > 0 && (
                     <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${isPositivePortfolio ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        Net PNL: {isPositivePortfolio ? '+' : ''}{totalPnLPercent.toFixed(2)}%
                     </div>
                   )}
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/20">
                        <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset</th>
                        <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Volume</th>
                        <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Avg Entry</th>
                        <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Live PNL</th>
                        <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {portfolio.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-16 text-center text-slate-500 font-medium">
                            <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            No active holdings mapped. Log your first position to track live metrics.
                          </td>
                        </tr>
                      ) : portfolio.map((item) => {
                        const isPositive = item.pnl >= 0;
                        return (
                          <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="p-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-xs text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                  {item.stock.symbol.split('.')[0][0]}
                                </div>
                                <div>
                                  <p className="font-bold text-white tracking-wide">{item.stock.symbol}</p>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Equity</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-5 text-sm font-bold text-slate-300 text-right">{item.quantity}</td>
                            <td className="p-5 text-right w-36">
                               <p className="text-sm font-bold text-slate-200">₹{item.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1})}</p>
                               <p className="text-[10px] font-black text-slate-500 uppercase mt-1">Live: ₹{item.currentPrice?.toLocaleString(undefined, { maximumFractionDigits: 1}) || '--'}</p>
                            </td>
                            <td className="p-5 w-48 text-right">
                              <div className={`inline-flex items-center gap-1.5 font-bold text-sm ${isPositive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'} px-3 py-1.5 rounded-lg border w-fit ml-auto shadow-sm`}>
                                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                <span>₹{Math.abs(item.pnl || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({item.pnlPercent?.toFixed(1)}%)</span>
                              </div>
                            </td>
                            <td className="p-5 text-center">
                               <button className="text-slate-600 hover:text-rose-400 transition-colors p-2 hover:bg-rose-500/10 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Watchlist Section */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <Bookmark className="w-5 h-5 text-fuchsia-400" />
                  <h2 className="text-xl font-black text-white">Radar Watchlist</h2>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {watchlist.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-white/10 rounded-2xl">
                      Watchlist radar is empty.
                    </div>
                  ) : watchlist.map((item) => (
                    <motion.div 
                      layout
                      key={item.id} 
                      className="p-4 rounded-2xl flex justify-between items-center group bg-black/40 border border-white/5 hover:border-white/20 transition-all cursor-default relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/0 to-fuchsia-500/0 group-hover:to-fuchsia-500/5 transition-colors pointer-events-none" />
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-sm text-slate-300 group-hover:text-fuchsia-400 transition-all">
                          {item.stock.symbol.split('.')[0][0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-white tracking-wide mb-1">{item.stock.symbol}</h4>
                          <p className="text-[10px] text-fuchsia-500/70 font-black uppercase tracking-widest">Tracking Active</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveWatchlist(item.id)}
                        className="relative z-10 opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 transition-all translate-x-2 group-hover:translate-x-0 bg-rose-500/0 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Holding Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#03060b]/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d1117] p-10 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[40px] border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[50px] pointer-events-none" />
              
              <h3 className="text-2xl font-black text-white mb-8 tracking-tight flex items-center gap-3 relative z-10">
                 <Plus className="w-6 h-6 text-blue-400" />
                 Log Trade Position
              </h3>
              
              <form onSubmit={handleAddPortfolio} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Symbol</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. RELIANCE"
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-bold text-white placeholder:text-slate-600 uppercase"
                    value={newItem.symbol}
                    onChange={(e) => setNewItem({ ...newItem, symbol: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Volume (Qty)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-bold text-white placeholder:text-slate-600"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buy Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-bold text-white placeholder:text-slate-600"
                      value={newItem.avgPrice}
                      onChange={(e) => setNewItem({ ...newItem, avgPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-bold text-sm text-slate-400"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  >
                    Confirm Injection
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Broker Connect Modal */}
      <AnimatePresence>
        {showBrokerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#03060b]/90 backdrop-blur-lg">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0d1117] p-10 w-full max-w-md shadow-[0_0_80px_rgba(217,70,239,0.15)] rounded-[40px] border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 blur-[80px] pointer-events-none" />
              
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center gap-3 relative z-10">
                 <Activity className="w-6 h-6 text-fuchsia-400" />
                 Connect Live Broker
              </h3>
              <p className="text-sm font-medium text-slate-400 mb-8 relative z-10">Sync your live equity holdings instantly via official broker APIs.</p>
              
              <form onSubmit={handleConnectBroker} className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Broker</label>
                  <div className="grid grid-cols-1 gap-3">
                     <div 
                       onClick={() => setSelectedBroker('zerodha')}
                       className={`flex items-center justify-center gap-2 p-4 rounded-2xl border cursor-pointer transition-all bg-orange-500/10 border-orange-500/50 text-orange-400`}
                     >
                        <strong className="text-sm">Zerodha Kite (Kite Connect API)</strong>
                     </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Authentication Key</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Enter your API Key..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 transition-all text-sm font-bold text-white placeholder:text-slate-600"
                    value={brokerKey}
                    onChange={(e) => setBrokerKey(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 mt-2 ml-1">Keys are encrypted end-to-end and purely used for read-only sync operations.</p>
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    type="button" 
                    onClick={() => setShowBrokerModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all font-bold text-sm text-slate-400"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                  >
                    Authorize Sync
                  </button>
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
