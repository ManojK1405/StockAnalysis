import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      const formattedSymbol = newAlert.symbol.toUpperCase().endsWith('.NS') || newAlert.symbol.toUpperCase().endsWith('.BO') 
          ? newAlert.symbol.toUpperCase() 
          : `${newAlert.symbol.toUpperCase()}.NS`;
          
      await axios.post('http://localhost:5001/api/alerts', { ...newAlert, symbol: formattedSymbol }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setShowModal(false);
      fetchAlerts();
    } catch (e) {
      alert('Failed to set alert. Backend linkage may be required.');
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
    <div className="relative min-h-[calc(100vh-2rem)] bg-[#03060b] text-slate-200 overflow-hidden m-4 rounded-[40px] shadow-2xl border border-white/5 font-outfit">
      
      {/* Background Ambience */}
      <div className="absolute top-[-25%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/10 blur-[180px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 p-8 md:p-12 mb-12 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
               <Bell className="w-8 h-8 text-emerald-400" />
               Alerts Center
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">Deploy Strict Price Notification Triggers</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
          >
            <Plus className="w-5 h-5" />
            Deploy Trigger
          </button>
        </header>

        {loading ? (
           <div className="flex flex-col items-center justify-center min-h-[40vh]">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-t-2 border-emerald-400 rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                <Activity className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto" />
              </div>
              <h2 className="text-lg font-black tracking-widest uppercase text-white animate-pulse">Syncing Active Triggers</h2>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
             {alerts.length === 0 ? (
               <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/5 border-dashed rounded-[32px] p-16 flex flex-col items-center justify-center text-slate-400 shadow-2xl">
                  <Bell className="w-16 h-16 mb-6 text-slate-700" />
                  <p className="font-bold text-lg text-white">No Active Triggers Deployed</p>
                  <p className="text-sm mt-2 text-slate-500 font-medium">Set your first threshold intercept to receive live breach notifications.</p>
               </div>
             ) : alerts.map((alert) => (
               <motion.div 
                 layout
                 key={alert.id} 
                 className="bg-[#090d14]/80 backdrop-blur-xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between border border-white/10 rounded-[32px] shadow-xl hover:border-white/20 transition-all gap-6 group"
               >
                  <div className="flex items-center gap-6">
                     <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg ${alert.type === 'UPPER' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                        {alert.type === 'UPPER' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                     </div>
                     <div>
                        <h4 className="text-3xl font-black text-white tracking-tight uppercase mb-1">{alert.symbol}</h4>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                          <span className="uppercase tracking-widest text-[9px] font-black outline outline-1 outline-white/10 px-2 py-0.5 rounded bg-black/30">Logic Condition</span>
                          Trigger if live price {alert.type === 'UPPER' ? 'breaches above' : 'crashes below'} <span className="text-white font-bold tracking-wide">₹{alert.targetPrice.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-6 md:w-auto w-full justify-between md:justify-end border-t border-white/5 md:border-t-0 pt-4 md:pt-0">
                     <div className="text-right flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Set: {new Date(alert.createdAt).toLocaleDateString()}
                     </div>
                     <button 
                       onClick={() => handleDelete(alert.id)}
                       className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-all shadow-sm opacity-60 group-hover:opacity-100"
                     >
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
               </motion.div>
             ))}
          </div>
        )}

        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#03060b]/80 backdrop-blur-md">
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.95, opacity: 0, y: 20 }}
                 className="bg-[#0d1117] p-10 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md border border-white/10 relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[50px] pointer-events-none" />

                  <h3 className="text-2xl font-black text-white mb-8 tracking-tight flex items-center gap-3 relative z-10">
                     <Plus className="w-6 h-6 text-emerald-400" />
                     Configure Trigger
                  </h3>
                  
                  <form onSubmit={handleCreate} className="space-y-6 relative z-10">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Target</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. RELIANCE (NSE)"
                          value={newAlert.symbol}
                          onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-white placeholder:text-slate-600 uppercase"
                        />
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Threshold Price (₹)</label>
                        <input 
                          type="number"
                          step="0.01" 
                          required
                          placeholder="0.00"
                          value={newAlert.targetPrice}
                          onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                          className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-5 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-white placeholder:text-slate-600"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trigger Condition</label>
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                             type="button"
                             onClick={() => setNewAlert({ ...newAlert, type: 'UPPER' })}
                             className={`py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${newAlert.type === 'UPPER' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/10 bg-black/30 text-slate-500 hover:bg-white/5'}`}
                           >
                             Breach Up
                           </button>
                           <button 
                             type="button"
                             onClick={() => setNewAlert({ ...newAlert, type: 'LOWER' })}
                             className={`py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${newAlert.type === 'LOWER' ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-white/10 bg-black/30 text-slate-500 hover:bg-white/5'}`}
                           >
                             Crash Down
                           </button>
                        </div>
                     </div>

                     <div className="flex gap-4 pt-6 mt-6 border-t border-white/5">
                        <button 
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="flex-1 py-4 font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-sm"
                        >
                           Cancel
                        </button>
                        <button 
                          type="submit"
                          className="flex-[1.5] bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
                        >
                           Deploy Trigger
                        </button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Alerts;
