import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Newspaper, Search, ArrowUpRight, ArrowDownRight, Info, BookmarkPlus, PlayCircle, Activity, Globe, Database, Cpu, Zap, SearchCode } from 'lucide-react';
import * as api from '../api';
import StockChart from '../components/StockChart';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [backtestData, setBacktestData] = useState(null);
  const [loadingBacktest, setLoadingBacktest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const resp = await axios.get(`http://localhost:5001/api/predictions/search/${query}`);
      setSuggestions(resp.data);
    } catch (e) {
      console.error("Suggestions error:", e);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    fetchSuggestions(val);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      const formatted = searchInput.toUpperCase().includes('.') ? searchInput.toUpperCase() : `${searchInput.toUpperCase()}.NS`;
      setSymbol(formatted);
      setSearchInput(formatted);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClick = () => setShowSuggestions(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const fetchBacktest = async (targetSymbol) => {
    setLoadingBacktest(true);
    try {
      const resp = await axios.get(`http://localhost:5001/api/backtest/${targetSymbol}`);
      setBacktestData(resp.data);
    } catch (e) {
      console.error('Backtest error:', e);
    } finally {
      setLoadingBacktest(false);
    }
  };

  const fetchAnalysis = async (targetSymbol) => {
    setLoading(true);
    setBacktestData(null);
    setData(null);
    try {
      const res = await api.getPrediction(targetSymbol);
      setData(res.data);
      fetchBacktest(targetSymbol);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchAnalysis(symbol);
    }
  }, [symbol]);

  const handleAddToWatchlist = async () => {
    if (!data) return;
    setAddingToWatchlist(true);
    try {
      await api.addToWatchlist(data.symbol);
      alert('Added to watchlist!');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setAddingToWatchlist(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(1)} Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(1)} L`;
    return num.toLocaleString();
  };

  return (
    <div className="relative min-h-[calc(100vh-2rem)] bg-[#03060b] text-slate-200 overflow-hidden m-4 rounded-[40px] shadow-2xl border border-white/5 font-outfit">
      
      {/* Background Ambience */}
      <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-blue-600/10 blur-[180px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 p-8 md:p-12">
        <header className="flex mb-12 flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-400" />
              Global Equity Desk
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-medium uppercase tracking-[0.2em]">Institutional Engine & Predictive Modeling</p>
          </div>
          
          <div className="relative flex-1 w-full max-w-md">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <SearchCode className="h-5 w-5 text-blue-400" />
            </div>
            <input
              type="text"
              placeholder="Search ticker (e.g. TCS.NS)..."
              value={searchInput}
              onChange={handleSearch}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-[#0d1117]/80 backdrop-blur-xl border border-white/10 rounded-full py-4 pl-14 pr-6 text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            />
            
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-[calc(100%+12px)] left-0 right-0 bg-[#0d1117]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-2 space-y-1">
                    {suggestions.map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          setSymbol(s.symbol);
                          setSearchInput(s.symbol);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-5 py-3 text-left hover:bg-white/5 rounded-2xl flex items-center justify-between group transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-wide">{s.symbol}</span>
                          <span className="text-[10px] text-slate-500 font-medium tracking-wide truncate max-w-[200px] mt-0.5">{s.name}</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-all" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!data && !loading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[50vh] rounded-[40px] bg-white/[0.02] border border-white/[0.05] border-dashed backdrop-blur-sm"
            >
              <div className="relative group">
                 <div className="absolute inset-0 bg-blue-500/20 blur-[60px] group-hover:bg-blue-500/40 transition-all duration-700 rounded-full" />
                 <Cpu className="w-24 h-24 text-[#0d1117] relative z-10 drop-shadow-[0_0_20px_rgba(96,165,250,0.5)] bg-slate-200 p-5 rounded-[2rem]" />
              </div>
              <p className="mt-8 text-xl font-bold text-slate-300">Awaiting Terminal Input</p>
              <p className="mt-3 text-sm text-slate-500 font-medium max-w-md text-center leading-relaxed">
                Enter an Indian equity symbol in the search bar above to generate a full fundamental, technical, and algorithmic profile.
              </p>
            </motion.div>
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] rounded-[40px] bg-white/[0.02] backdrop-blur-md border border-white/5"
            >
              <div className="relative w-32 h-32 mb-10">
                <div className="absolute inset-0 border-t-2 border-blue-400 rounded-full animate-spin shadow-[0_0_30px_rgba(59,130,246,0.5)]" />
                <div className="absolute inset-2 border-r-2 border-fuchsia-400 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
                <div className="absolute inset-4 border-b-2 border-cyan-400 rounded-full animate-[spin_3s_linear_infinite]" />
                <Globe className="w-10 h-10 text-white absolute inset-0 m-auto" />
              </div>
              <h2 className="text-2xl font-black tracking-widest uppercase text-white animate-pulse">Aggregating Nodes</h2>
              <p className="mt-3 text-[10px] uppercase tracking-[0.4em] text-blue-400/80 font-bold">Scanning Global Architectures</p>
            </motion.div>
          ) : data ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
              className="space-y-8"
            >
              {/* Header Profile Area */}
              <div className="flex flex-col xl:flex-row gap-8">
                {/* Main Graph Panel */}
                <div className="flex-1 bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 overflow-hidden relative shadow-2xl">
                  {/* Decorative corner curve */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-blue-500/20 border border-blue-500/40 text-blue-400 px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-lg backdrop-blur-md">
                          Institutional View
                        </span>
                      </div>
                      <h2 className="text-5xl font-black text-white tracking-tighter shadow-sm">{data.symbol}</h2>
                      <p className="mt-2 text-slate-400 font-medium text-lg">{data.name}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-4xl font-extrabold text-white tracking-tight">₹{data.currentPrice?.toLocaleString()}</p>
                      <button 
                        onClick={handleAddToWatchlist}
                        disabled={addingToWatchlist}
                        className="mt-4 flex items-center gap-2 bg-white/5 hover:bg-blue-500/20 hover:text-blue-300 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 transition-all ml-auto"
                      >
                        <BookmarkPlus className="w-4 h-4" /> Watchlist
                      </button>
                    </div>
                  </div>

                  <div className="h-[400px] w-full mt-6 rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative z-10 p-2">
                     <StockChart data={data.chartData} />
                  </div>
                </div>

                {/* Algorithmic Side Panel */}
                <div className="w-full xl:w-[400px] flex flex-col gap-6">
                  {/* AI Prediction Box */}
                  <div className="bg-gradient-to-br from-[#0e131f] to-[#0a0f18] border border-blue-500/20 rounded-[32px] p-8 shadow-[0_0_40px_rgba(59,130,246,0.05)] relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                    <div className="absolute -right-6 -top-6 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                       <Zap className="w-32 h-32" />
                    </div>
                    
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-blue-400 mb-6 shrink-0 relative z-10">Algorithmic Vector</p>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                       <div>
                         <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Compute Bias</p>
                         <p className={`text-3xl font-black tracking-tight ${data.signal.toUpperCase().includes('BUY') ? 'text-emerald-400' : data.signal.toUpperCase().includes('SELL') ? 'text-rose-400' : 'text-slate-300'}`}>
                           {data.signal}
                         </p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Trade Duration</p>
                         <p className="text-lg font-black tracking-tight text-white mt-1">{data.duration}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 relative z-10 mt-6 pt-6 border-t border-white/5">
                      <div>
                         <p className="text-[10px] uppercase font-black text-emerald-500/70 tracking-widest mb-1">Entry Price</p>
                         <p className="text-[15px] xl:text-lg font-bold text-emerald-400">₹{data.buyLevel?.toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[10px] uppercase font-black text-blue-400/70 tracking-widest mb-1">Target</p>
                         <p className="text-[15px] xl:text-lg font-bold text-blue-400">₹{data.sellLevel?.toFixed(1)}</p>
                      </div>
                      <div className="text-right border-l border-white/10">
                         <p className="text-[10px] uppercase font-black text-rose-400/70 tracking-widest mb-1">Stop Loss</p>
                         <p className="text-[15px] xl:text-lg font-bold text-rose-400">₹{data.stopLoss?.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Smart Diagnostics */}
                  <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Analytic Rationale</p>
                    <div className="space-y-5">
                      {data.reasoning.map((reason, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                          <p className="text-[13px] text-slate-300 leading-relaxed font-medium">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Modulators */}
              <div className="grid xl:grid-cols-[1fr_2fr] gap-8 mt-6">
                
                {/* Key Metrics / Fundamentals View */}
                <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 h-full shadow-2xl">
                   <div className="flex items-center gap-3 mb-8">
                      <Database className="w-5 h-5 text-slate-400" />
                      <h3 className="text-lg font-black text-white tracking-tight">Market Core</h3>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                     <div className="border-l border-white/10 pl-4">
                       <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Cap Base</p>
                       <p className="text-xl font-bold text-white">{formatNumber(data.fundamentals?.marketCap)}</p>
                     </div>
                     <div className="border-l border-white/10 pl-4">
                       <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">P/E Modulus</p>
                       <p className="text-xl font-bold text-white">{data.fundamentals?.peRatio?.toFixed(2) || 'N/A'}</p>
                     </div>
                     <div className="border-l border-white/10 pl-4">
                       <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Div Yield</p>
                       <p className="text-xl font-bold text-white">{(data.fundamentals?.dividendYield * 100)?.toFixed(2) || '0.00'}%</p>
                     </div>
                     <div className="border-l border-white/10 pl-4">
                       <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Beta Risk</p>
                       <p className="text-xl font-bold text-white">{data.fundamentals?.beta?.toFixed(2) || 'N/A'}</p>
                     </div>
                   </div>
                </div>

                {/* Telemetry / Backtest Engine */}
                <div className="bg-[#090d14]/80 backdrop-blur-xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/[0.02] to-transparent rounded-[32px] p-8 shadow-2xl overflow-hidden relative">
                   <div className="absolute right-0 bottom-0 opacity-10">
                     <Activity className="w-48 h-48 text-fuchsia-500" />
                   </div>
                   <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-white/5 gap-4">
                      <div>
                        <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                           <PlayCircle className="w-5 h-5 text-fuchsia-400" /> 12-Month Telemetry Backtest
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Historical validation of algorithmic parameters directly against NIFTY benchmark.</p>
                      </div>
                   </div>

                   {loadingBacktest ? (
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-24">
                        {[1,2,3,4].map(idx => (
                          <div key={idx} className="bg-white/5 rounded-2xl animate-pulse" />
                        ))}
                     </div>
                   ) : backtestData ? (
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
                        <div className="bg-black/30 border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors">
                           <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2">Strategy APY</p>
                           <p className="text-2xl font-black text-white">{backtestData.totalReturn}%</p>
                        </div>
                        <div className="bg-black/30 border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors">
                           <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2">Benchmark APY</p>
                           <p className="text-2xl font-black text-slate-300">{backtestData.benchmarkReturn}%</p>
                        </div>
                        <div className="bg-black/30 border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors">
                           <p className="text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-2">Executed Trades</p>
                           <p className="text-2xl font-black text-white">{backtestData.tradeCount}</p>
                        </div>
                        <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 p-5 rounded-2xl">
                           <p className="text-[9px] uppercase font-bold tracking-widest text-fuchsia-400 mb-2">Net Status</p>
                           <p className={`text-xl tracking-tight font-black ${parseFloat(backtestData.totalReturn) > parseFloat(backtestData.benchmarkReturn) ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {parseFloat(backtestData.totalReturn) > parseFloat(backtestData.benchmarkReturn) ? 'OUTPERFORM' : 'LAGGING'}
                           </p>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center py-6 text-sm text-slate-500 font-medium">Telemetry simulation bounds unavailable for this symbol sequence.</div>
                   )}
                </div>

              </div>

              {/* Bottom Section: Narrative and News */}
              <div className="grid xl:grid-cols-[1fr_1.2fr] gap-8 mt-4">
                
                {/* AI Trend Narrative */}
                <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                     <Activity className="w-5 h-5 text-blue-400" />
                     <h3 className="text-lg font-black text-white tracking-tight">Trend Architecture</h3>
                  </div>
                  <div className="flex-1 space-y-6">
                    <p className="text-sm font-medium text-slate-300 leading-relaxed border-l-2 border-blue-500/50 pl-4 py-1">
                      {data.trendAnalysis?.overall?.description || "Market structure is currently undergoing testing and price discovery."}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Volume Profile</p>
                         <p className="text-xs font-medium text-slate-300 leading-relaxed">{data.trendAnalysis?.volume?.description}</p>
                      </div>
                      <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Oscillation Status</p>
                         <p className="text-xs font-medium text-slate-300 leading-relaxed">{data.trendAnalysis?.indicators?.macd?.description}</p>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Actionable Zones</p>
                       <p className="text-xs font-medium text-slate-300 leading-relaxed">{data.trendAnalysis?.supportResistance?.description}</p>
                    </div>
                  </div>
                </div>

                {/* Live News Feed */}
                <div className="bg-[#090d14]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl flex flex-col h-full max-h-[500px]">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <Newspaper className="w-5 h-5 text-fuchsia-400" />
                        <h3 className="text-lg font-black text-white tracking-tight">Live Media & Sentiment Feed</h3>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {data.news && data.news.length > 0 ? (
                      data.news.map((item, i) => (
                        <a 
                          key={i} 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block bg-black/30 border border-white/5 hover:border-fuchsia-500/30 p-4 rounded-2xl transition-all group"
                        >
                          <div className="flex justify-between items-start mb-2 gap-4">
                            <h4 className="text-sm font-bold text-slate-200 group-hover:text-fuchsia-400 transition-colors line-clamp-2 leading-relaxed">{item.title}</h4>
                            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-fuchsia-400 shrink-0" />
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                             <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-white/5 px-2 py-1 rounded-md">{item.source || 'Market Feed'}</span>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-50 py-10">
                         <Newspaper className="w-12 h-12 text-slate-600 mb-4" />
                         <p className="text-sm font-medium text-slate-400">No recent mainstream media coverage found.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;
