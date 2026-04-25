import { MinusIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import SectionTitle from '../components/section-title';
import { motion, AnimatePresence } from 'framer-motion';

export default function FaqSection() {
    const [isOpen, setIsOpen] = useState(null);
    const data = [
        {
            question: 'How accurate is the AI sentiment analysis?',
            answer: "Our models process real-time financial news using institutional-grade NLP. While no model is 100% perfect, it provides a high-confidence 'mood score' that often precedes price action.",
        },
        {
            question: 'Do you support multi-broker connectivity?',
            answer: 'Yes, EquiSense currently supports Zerodha (Kite), Dhan, and Groww for live portfolio tracking.',
        },
        {
            question: 'What is the difference between Live and Mock modes?',
            answer: 'Live mode fetches your actual holdings via API for execution. Mock mode uses our internal database for risk-free paper trading and backtesting.',
        },
        {
            question: 'Is my financial data secure?',
            answer: 'We never store your live portfolio data on our servers. Trade data is fetched on-the-fly and streamed directly to your browser via encrypted WebSockets.',
        },
        {
            question: 'How often does the Intraday Pulse update?',
            answer: 'Candidates are scanned every minute during market hours to ensure you never miss a momentum breakout.',
        },
    ];

    return (
        <section className='flex flex-col items-center justify-center mt-40 pb-20'>
            <SectionTitle title="Common Queries" subtitle="Everything you need to know about navigating the market with EquiSense intelligence." />
            <div className='mx-auto mt-12 w-full max-w-2xl px-6'>
                {data.map((item, index) => (
                    <div key={index} className='border-b border-slate-100 last:border-0'>
                        <button 
                            className='flex w-full items-center justify-between gap-4 py-6 text-left group'
                            onClick={() => setIsOpen(isOpen === index ? null : index)}
                        >
                            <span className={`text-lg font-bold tracking-tight transition-colors ${isOpen === index ? 'text-orange-600' : 'text-slate-800 group-hover:text-orange-500'}`}>
                                {item.question}
                            </span>
                            <div className={`p-2 rounded-full transition-all ${isOpen === index ? 'bg-orange-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                {isOpen === index ? <MinusIcon className='size-4' /> : <PlusIcon className='size-4' />}
                            </div>
                        </button>
                        
                        <AnimatePresence>
                            {isOpen === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                    className="overflow-hidden"
                                >
                                    <div className="pb-6 text-slate-500 leading-relaxed font-medium">
                                        {item.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </section>
    );
}