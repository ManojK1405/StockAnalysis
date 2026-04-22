import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, BarChart3, PieChart, Newspaper, ArrowUpRight, ArrowDownRight, Globe, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

const Dashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [searchResults, setSearchResults] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [selectedStock, setSelectedStock] = useState(null);

    const fetchMarket = async () => {
        try {
            setLoading(true);
            const res = await api.get('/market/summary');
            setMarketData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarket();
    }, []);

    const handleSelection = (stock) => {
        setSearchQuery('');
        setShowSuggestions(false);
        setSelectedStock(stock);
    };

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                setShowSuggestions(false);
                return;
            }
            try {
                const res = await api.get(`/market/search?q=${searchQuery}`);
                setSearchResults(res.data);
                setShowSuggestions(true);
            } catch (e) {
                console.error(e);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <div className="bg-[#fcfdfe] min-h-screen">
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 text-center">
                <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Stock Analysis</h2>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight italic uppercase mb-16 underline decoration-blue-600 underline-offset-8">Research <span className="text-blue-600">Terminal</span></h1>
                
                {/* Search Bar */}
                <div className="max-w-3xl mx-auto mb-16 relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search className="w-6 h-6" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search for stocks (e.g. RELIANCE, TCS, AAPL)..." 
                        className="w-full pl-16 pr-8 py-6 bg-white border border-slate-200 rounded-[32px] shadow-2xl text-lg font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />

                    {showSuggestions && searchResults.length > 0 && (
                        <div className="absolute top-[calc(100%+10px)] left-0 w-full bg-white border border-slate-100 rounded-[32px] shadow-2xl z-50 overflow-hidden text-left py-4">
                            {searchResults.map((res) => (
                                <div 
                                    key={res.symbol} 
                                    className="px-8 py-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                                    onClick={() => handleSelection(res)}
                                >
                                    <div>
                                        <p className="font-black text-slate-900 tracking-tight">{res.symbol}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.name}</p>
                                    </div>
                                    <div className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest leading-none">
                                        {res.exch}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Market Momentum */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 overflow-hidden relative">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
                             <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 italic tracking-tight uppercase italic">
                                    <TrendingUp className="w-6 h-6 text-blue-600" />
                                    Market Analysis
                                </h3>
                             </div>
                             
                             <div className="aspect-[21/9] w-full bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-center">
                                <div className="text-center">
                                    <BarChart3 className="w-16 h-16 text-slate-200 mb-4 mx-auto animate-pulse" />
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Select an asset to load interactive chart</p>
                                </div>
                             </div>

                             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {marketData?.pulse?.map((idx) => (
                                    <div key={idx.symbol} className={`p-6 rounded-3xl border ${idx.changePercent >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${idx.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{idx.name}</p>
                                        <p className={`text-xl font-bold ${idx.changePercent >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>₹{idx.price.toLocaleString()}</p>
                                        <p className={`text-xs font-bold mt-1 ${idx.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{idx.changePercent.toFixed(2)}%</p>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
                                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 tracking-tight italic">
                                    <Layers className="w-5 h-5 text-indigo-500" />
                                    Top Sector Gainers
                                </h4>
                                <div className="space-y-4">
                                    {['Metals', 'Auto', 'Energy'].map(s => (
                                        <div key={s} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <span className="font-bold text-slate-700">{s}</span>
                                            <span className="text-emerald-600 font-bold text-sm">+2.4%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
                                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 tracking-tight italic">
                                    <Globe className="w-5 h-5 text-fuchsia-500" />
                                    Global Indices
                                </h4>
                                <div className="space-y-4">
                                    {['Nasdaq', 'DAX', 'Nikkei'].map(s => (
                                        <div key={s} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <span className="font-bold text-slate-700">{s}</span>
                                            <span className="text-rose-600 font-bold text-sm">-0.8%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Side Feed */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-xl shadow-indigo-200">
                            <h4 className="text-xl font-bold mb-6 flex items-center gap-2 italic">
                                <Newspaper className="w-6 h-6 text-indigo-300" />
                                Market News
                            </h4>
                            <div className="space-y-6">
                                {marketData?.topNews?.map((news, i) => (
                                    <div key={i} className="border-b border-indigo-500/50 pb-6">
                                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">{news.publisher} • {news.content}</p>
                                        <a href={news.link} target="_blank" rel="noreferrer" className="font-bold leading-tight hover:text-indigo-200 cursor-pointer block">
                                            {news.title}
                                        </a>
                                    </div>
                                ))}
                                <button className="w-full py-4 rounded-2xl bg-indigo-500/50 hover:bg-indigo-500 transition-all font-bold text-sm">View All Research</button>
                            </div>
                        </div>

                        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
                            <h4 className="text-lg font-bold text-slate-900 mb-6 tracking-tight italic flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Recent Analysis
                            </h4>
                            <div className="space-y-4">
                                {marketData?.trending?.map((stock) => (
                                    <div key={stock.symbol} className="flex justify-between items-center p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-bold text-slate-900 shadow-sm">
                                                {stock.symbol[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm tracking-tight">{stock.symbol}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">₹{stock.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center font-bold text-xs ${stock.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {stock.changePercent.toFixed(2)}%
                                            {stock.change >= 0 ? <ArrowUpRight className="w-3 h-3 ml-1" /> : <ArrowDownRight className="w-3 h-3 ml-1" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
