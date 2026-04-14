import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAlert, setNewAlert] = useState({ symbol: '', targetPrice: '', type: 'UPPER' });

  const fetchAlerts = async () => {
    try {
      const resp = await axios.get('http://localhost:5001/api/alerts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAlerts(resp.data);
    } catch (e) {
      console.error('Alerts fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/alerts', newAlert, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setShowModal(false);
      fetchAlerts();
    } catch (e) {
      alert('Failed to set alert. Check if symbol is correct.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/alerts/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchAlerts();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Bell className="w-8 h-8 text-indigo-600" />
             Alerts Center
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Never miss a price breach or trend reversal.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="premium-button flex items-center gap-2 shadow-xl shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" />
          Create Alert
        </button>
      </header>

      {loading ? (
        <div className="space-y-4 animate-pulse">
           {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
           {alerts.length === 0 ? (
             <div className="h-64 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300">
                <Bell className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium text-lg text-slate-400">No active alerts. Set your first trigger to stay informed.</p>
             </div>
           ) : alerts.map((alert) => (
             <motion.div 
               layout
               key={alert.id} 
               className="glass-card p-6 flex items-center justify-between border-slate-100 bg-white"
             >
                <div className="flex items-center gap-6">
                   <div className={`p-4 rounded-2xl ${alert.type === 'UPPER' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {alert.type === 'UPPER' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                   </div>
                   <div>
                      <h4 className="text-xl font-bold text-slate-900 uppercase">{alert.symbol}</h4>
                      <p className="text-sm font-medium text-slate-500">
                        Trigger: Price {alert.type === 'UPPER' ? 'goes above' : 'falls below'} <span className="text-slate-900 font-bold">₹{alert.targetPrice}</span>
                      </p>
                   </div>
                </div>
                
                <div className="flex items-center gap-6">
                   <div className="text-right flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <Clock className="w-3 h-3" />
                      Set {new Date(alert.createdAt).toLocaleDateString()}
                   </div>
                   <button 
                     onClick={() => handleDelete(alert.id)}
                     className="p-3 bg-rose-50 text-rose-300 hover:text-rose-600 rounded-xl transition-all"
                   >
                      <Trash2 className="w-5 h-5" />
                   </button>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
           <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100"
           >
              <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Set Price Trigger</h3>
              <form onSubmit={handleCreate} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Symbol</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. RELIANCE"
                      value={newAlert.symbol}
                      onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="0.00"
                      value={newAlert.targetPrice}
                      onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alert Type</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                         type="button"
                         onClick={() => setNewAlert({ ...newAlert, type: 'UPPER' })}
                         className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${newAlert.type === 'UPPER' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
                       >
                         Price Crossing Up
                       </button>
                       <button 
                         type="button"
                         onClick={() => setNewAlert({ ...newAlert, type: 'LOWER' })}
                         className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${newAlert.type === 'LOWER' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
                       >
                         Price Crossing Down
                       </button>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600"
                    >
                       Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all"
                    >
                       Confirm Alert
                    </button>
                 </div>
              </form>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
