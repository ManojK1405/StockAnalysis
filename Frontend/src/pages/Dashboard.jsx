import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { TrendingUp, Newspaper, Search, ArrowUpRight, Info, BookmarkPlus, Bell, PlayCircle, Activity } from 'lucide-react';
import * as api from '../api';
import StockChart from '../components/StockChart';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [backtestData, setBacktestData] = useState(null);
  const [loadingBacktest, setLoadingBacktest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('RELIANCE.NS');
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
    setSymbol(val);
    fetchSuggestions(val);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const formatted = symbol.toUpperCase().includes('.') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
      setSymbol(formatted);
      fetchAnalysis(formatted);
      setShowSuggestions(false);
    }
  };

  // Close suggestions on click outside
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
    setBacktestData(null); // Reset backtest on new search
    try {
      const res = await api.getPrediction(targetSymbol);
      setData(res.data);
      // Auto-run backtest for the same symbol
      fetchBacktest(targetSymbol);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(symbol);
  }, []);

  // handleSearch removed (merged above)

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

  return (
    <div className="p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-plus-jakarta tracking-tight">Market Analytics</h1>
          <p className="text-gray-400 mt-1">AI-driven predictive analysis for NSE/BSE stocks</p>
        </div>
              <div className="relative flex-1 w-full md:w-auto">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Analyze a stock symbol (e.g. RELIANCE, TCS)..."
                  value={symbol}
                  onChange={handleSearch}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium placeholder:text-slate-400 shadow-sm"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((s) => (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          setSymbol(s.symbol);
                          fetchAnalysis(s.symbol);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-6 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">{s.symbol}</span>
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{s.name}</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
          <div className="bg-white border border-slate-100 rounded-[32px] col-span-2 h-[500px]"></div>
          <div className="bg-white border border-slate-100 rounded-[32px] h-[500px]"></div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Main Chart Card */}
            <div className="glass-card p-8 md:col-span-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleAddToWatchlist}
                  disabled={addingToWatchlist}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-indigo-600"
                >
                  <BookmarkPlus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-widest uppercase border border-indigo-100">Market Intelligence</span>
                    <span className="text-slate-400 text-xs font-medium">Real-time Analysis</span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight mb-2 text-slate-900">{data.symbol}</h2>
                  <p className="text-slate-500 font-medium">{data.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-slate-900 mb-2">₹{data.currentPrice.toLocaleString()}</p>
                  <div className="flex items-center gap-1 justify-end text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Live Quote</span>
                  </div>
                </div>
              </div>

              <div className="h-[350px]">
                <StockChart data={data.chartData} />
              </div>
            </div>

            {/* AI Sidepanel */}
            <div className="md:col-span-4 space-y-6">
              <div className="glass-card p-6 border-indigo-100 bg-indigo-50/10">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Predictive Strategy
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                     <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">AI Verdict</p>
                        <p className={`text-xl font-black italic ${data.signal.includes('BUY') ? 'text-indigo-600' : 'text-rose-600'}`}>
                          {data.signal}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Certainty</p>
                        <p className="text-xl font-mono text-slate-900">{Math.abs(data.score).toFixed(0)}%</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 text-[9px]">Entry Point</p>
                      <p className="text-xl font-bold text-indigo-600">₹{data.buyLevel.toFixed(1)}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-emerald-100 transition-all">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 text-[9px]">Target Price</p>
                      <p className="text-xl font-bold text-emerald-600">₹{data.sellLevel.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Fundamentals Section */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Key Metrics</p>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Market Cap</p>
                        <p className="text-sm font-bold text-slate-900">₹{(data.fundamentals?.marketCap / 10000000).toFixed(0)} Cr</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">P/E Ratio</p>
                        <p className="text-sm font-bold text-slate-900">{data.fundamentals?.peRatio?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Yield</p>
                        <p className="text-sm font-bold text-slate-900">{(data.fundamentals?.dividendYield * 100)?.toFixed(1) || '0.0'}%</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Beta (Risk)</p>
                        <p className="text-sm font-bold text-slate-900">{data.fundamentals?.beta?.toFixed(2) || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       Market Rationale
                    </p>
                    <div className="space-y-4">
                      {data.reasoning.map((reason, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0 shadow-lg shadow-indigo-600/20" />
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 flex items-center justify-between border-slate-100">
                 <div>
                    <p className="text-xs text-slate-400 mb-1">Stop Loss Protection</p>
                    <p className="font-bold text-rose-600">₹{data.stopLoss.toFixed(1)}</p>
                 </div>
                 <div className="h-10 w-[1px] bg-slate-100" />
                 <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Sentiment</p>
                    <p className="font-bold text-indigo-600 italic">Positive</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Backtest Section */}
          <section className="mt-8">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                   <Activity className="w-6 h-6 text-indigo-600" />
                   12-Month Performance Simulation
                </h3>
             </div>
             
             {loadingBacktest ? (
               <div className="h-48 bg-white border border-slate-100 rounded-[32px] animate-pulse"></div>
             ) : backtestData ? (
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="glass-card p-6 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Strategy Return</p>
                     <p className="text-3xl font-black mt-2">{backtestData.totalReturn}%</p>
                  </div>
                  <div className="glass-card p-6 bg-white border-slate-200">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bench. Return</p>
                     <p className="text-3xl font-black text-slate-900 mt-2">{backtestData.benchmarkReturn}%</p>
                  </div>
                  <div className="glass-card p-6 bg-white border-slate-200">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Events</p>
                     <p className="text-3xl font-black text-slate-900 mt-2">{backtestData.tradeCount}</p>
                  </div>
                  <div className="glass-card p-6 bg-white border-slate-200">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Result</p>
                     <p className={`text-3xl font-black mt-2 ${parseFloat(backtestData.totalReturn) > parseFloat(backtestData.benchmarkReturn) ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {parseFloat(backtestData.totalReturn) > parseFloat(backtestData.benchmarkReturn) ? 'OUTPERFORM' : 'MATCH'}
                     </p>
                  </div>
               </div>
             ) : (
               <div className="p-8 text-center text-slate-400">Backtest simulation unavailable for this symbol.</div>
             )}
          </section>

          {/* Expanded News/Insights */}
          <section className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-cyan-400" />
                Intelligence Feed
              </h3>
              <button className="text-xs font-bold text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em]">View All News</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.news.slice(0, 3).map((article, i) => (
                <a 
                  key={i} 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="glass-card p-6 flex flex-col group hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest px-2 py-1 bg-cyan-500/10 rounded-md border border-cyan-500/20">
                      {article.source}
                    </span>
                    <span className="text-[10px] text-gray-600 font-bold">{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-md leading-tight mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-6 flex-1">{article.description}</p>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                     <span>Read Report</span>
                     <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[500px] glass-card border-dashed border-white/10 opacity-50">
           <Search className="w-16 h-16 text-gray-800 mb-4" />
           <p className="text-gray-500 font-medium">Search for an Indian equity symbol to begin deep analysis</p>
           <div className="flex gap-2 mt-6">
              {['TCS', 'RELIANCE', 'INFY', 'HDFCBANK'].map(s => (
                <button 
                  key={s} 
                  onClick={() => { setSymbol(`${s}.NS`); fetchAnalysis(`${s}.NS`); }}
                  className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                >
                  {s}
                </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
