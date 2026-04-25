import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Cpu, Zap, TrendingUp } from 'lucide-react';

export default function OurVision() {
    return (
        <div className="bg-white min-h-screen pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-6 uppercase italic pb-2 leading-tight">
                        Our <span className="text-premium">Vision</span>
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed font-medium">
                        Redefining wealth creation through the intersection of human intuition and artificial intelligence.
                    </p>
                </motion.div>

                <div className="space-y-32">
                    <section className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <Globe className="w-12 h-12 text-orange-500 mb-8" />
                            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight italic">Global Intelligence, Local Focus</h2>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                We envision a future where every Indian investor can harness global-scale data to dominate local market opportunities. EquiSense aims to be the bridge between complex quantitative math and actionable investment blueprints.
                            </p>
                        </div>
                        <div className="aspect-square bg-slate-100 rounded-[60px] flex items-center justify-center border border-slate-200">
                             <TrendingUp className="w-32 h-32 text-slate-300" />
                        </div>
                    </section>

                    <section className="grid md:grid-cols-2 gap-16 items-center">
                        <div className="order-2 md:order-1 aspect-square bg-slate-900 rounded-[60px] flex items-center justify-center shadow-2xl shadow-orange-900/20">
                             <Cpu className="w-32 h-32 text-orange-500/50" />
                        </div>
                        <div className="order-1 md:order-2">
                            <Zap className="w-12 h-12 text-rose-500 mb-8" />
                            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight italic">The AI Advantage</h2>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                Our vision is to evolve from a research terminal into a fully autonomous wealth orchestrator. We are building a future where AI doesn't just suggest trades, but dynamically adapts to market volatility to preserve and grow capital.
                            </p>
                        </div>
                    </section>

                    <section className="text-center bg-slate-50 rounded-[60px] p-16 border border-slate-100">
                        <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter italic">Join the Systematic Revolution.</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-lg font-medium">
                            We aren't just building a product; we're building a new standard for how wealth is managed in the digital age.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
