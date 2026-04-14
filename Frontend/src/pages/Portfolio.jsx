import React, { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Plus, Trash2, ArrowUpRight, ArrowDownRight, Briefcase, Bookmark } from 'lucide-react';
import * as api from '../api';
import { motion } from 'framer-motion';

const Portfolio = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
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

  const handleRemoveWatchlist = async (id) => {
    try {
      await api.removeFromWatchlist(id);
      fetchData();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Investment Hub</h1>
          <p className="text-slate-500 mt-1">Manage your holdings and watchlist</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          Add Holding
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Portfolio Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">My Portfolio</h2>
          </div>

          <div className="glass-card overflow-hidden bg-white border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stock</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Qty</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Avg Price</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current PnL</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portfolio.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400 font-medium">No active holdings. Add your first position to track performance.</td>
                  </tr>
                ) : portfolio.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-bold text-xs text-indigo-600">
                          {item.stock.symbol.split('.')[0][0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-none">{item.stock.symbol}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Equity Asset</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-600">{item.quantity}</td>
                    <td className="p-4 text-right pr-12">
                       <p className="text-sm font-bold text-slate-900">₹{item.avgPrice.toLocaleString()}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase">Current: ₹{item.currentPrice?.toLocaleString() || '--'}</p>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-1 font-bold text-sm ${item.pnl >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-3 py-1.5 rounded-lg w-fit`}>
                        {item.pnl >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>₹{Math.abs(item.pnl || 0).toLocaleString()} ({item.pnlPercent?.toFixed(1)}%)</span>
                      </div>
                    </td>
                    <td className="p-4">
                       <button className="text-slate-300 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Watchlist Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Watchlist</h2>
          </div>

          <div className="space-y-4">
            {watchlist.length === 0 ? (
              <div className="glass-card p-8 text-center text-slate-400 text-sm border-dashed">
                Watchlist is currently empty.
              </div>
            ) : watchlist.map((item) => (
              <motion.div 
                layout
                key={item.id} 
                className="glass-card p-5 flex justify-between items-center group cursor-pointer hover:border-indigo-200 transition-all bg-white border-slate-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-bold text-sm text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {item.stock.symbol.split('.')[0][0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-none mb-1">{item.stock.symbol}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase">Tracking Active</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveWatchlist(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-600 transition-all translate-x-4 group-hover:translate-x-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-[2px]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 w-full max-w-md shadow-2xl rounded-[32px] border border-slate-100 relative"
          >
            <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Add Asset Position</h3>
            <form onSubmit={handleAddPortfolio} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Symbol</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. RELIANCE"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buy Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all text-sm font-bold"
                    value={newItem.avgPrice}
                    onChange={(e) => setNewItem({ ...newItem, avgPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-sm text-slate-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30"
                >
                  Confirm Position
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
