import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Shield, Award } from 'lucide-react';

export default function AboutUs() {
    return (
        <div className="bg-white min-h-screen pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-6 uppercase italic pb-2 leading-tight">
                        About <span className="text-premium">EquiSense</span>
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed font-medium">
                        We are a team of quantitative analysts, data scientists, and engineers dedicated to democratizing institutional-grade investment intelligence.
                    </p>
                </motion.div>

                <div className="space-y-20">
                    <section>
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <Target className="w-6 h-6 text-orange-500" />
                            Our Mission
                        </h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            At EquiSense, our mission is to strip away market noise and provide retail investors with the same level of analytical clarity enjoyed by hedge funds. We believe that every investor deserves access to systematic, data-driven insights to navigate the complexities of the Indian equity markets.
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                            <Users className="w-10 h-10 text-rose-500 mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Quantitative Expertise</h3>
                            <p className="text-slate-500 leading-relaxed">
                                Our models are built on decades of historical data and refined with modern machine learning to identify high-probability momentum breakouts.
                            </p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                            <Shield className="w-10 h-10 text-orange-500 mb-6" />
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Data Integrity</h3>
                            <p className="text-slate-500 leading-relaxed">
                                We prioritize accuracy above all else. Our real-time data pipelines are rigorously validated to ensure you're making decisions on sound information.
                            </p>
                        </div>
                    </div>

                    <section className="text-center bg-slate-900 rounded-[60px] p-16 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full" />
                        <h2 className="text-3xl font-black mb-6 italic tracking-tight">Institutional Quality. Always.</h2>
                        <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
                            Since our inception in 2024, we've focused on one thing: building the most reliable research terminal for the modern systematic investor.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
