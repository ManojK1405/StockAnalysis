import React, { useState } from 'react';
import { Brain, Cpu, MessageSquare, Code2, Plus, Sparkles, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const AIStrategist = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your AI Quant Strategist. Tell me your investment thesis, and I'll build a backtested strategy for you." }
    ]);

    const handleSend = async () => {
        if (!prompt) return;
        const newMessages = [...messages, { role: 'user', content: prompt }];
        setMessages(newMessages);
        setPrompt('');
        setLoading(true);
        try {
            const res = await api.post('/strategy/chat', { messages: newMessages });
            setMessages(prev => [...prev, res.data]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble processing your request." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Header/Info Sidebar */}
                    <div className="lg:col-span-5">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] uppercase tracking-wider mb-8">
                                <Sparkles className="w-3 h-3" />
                                LLM Powered Quant Engine
                            </div>
                            <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-8">
                                AI <span className="text-blue-600">Strategist</span>
                            </h1 >
                            <p className="text-lg text-slate-600 mb-12 leading-relaxed">
                                Natural language interface for institutional-grade quantitative strategies. Type your ideas, we generate the code and logic.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4 p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                        <Code2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">Code Generation</h4>
                                        <p className="text-sm text-slate-500">Automatically generate Python/JavaScript execution logic.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm">
                                    <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600 shrink-0">
                                        <Cpu className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 mb-1">Deep Backtesting</h4>
                                        <p className="text-sm text-slate-500">Instant validation across 10+ years of historical data.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Chat Interface */}
                    <div className="lg:col-span-7">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[48px] border border-slate-200 shadow-2xl h-[700px] flex flex-col overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">QuantBot 1.0</h3>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Always Active</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-6 rounded-[32px] font-medium text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Describe your strategy idea..." 
                                        className="w-full p-5 pr-16 bg-white border border-slate-200 rounded-3xl shadow-sm focus:outline-none focus:border-blue-600 font-medium"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <button 
                                        onClick={handleSend}
                                        className="absolute right-2 top-2 bottom-2 aspect-square rounded-2xl bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AIStrategist;
