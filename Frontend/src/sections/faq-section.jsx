import { MinusIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import SectionTitle from '../components/section-title';

export default function FaqSection() {
    const [isOpen, setIsOpen] = useState(false);
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
        <section className='flex flex-col items-center justify-center mt-40'>
            <SectionTitle title="Common Queries" subtitle="Everything you need to know about navigating the market with EquiSense intelligence." />
            <div className='mx-auto mt-12 w-full max-w-xl'>
                {data.map((item, index) => (
                    <div key={index} className='flex flex-col border-b border-gray-200 bg-white'>
                        <h3 className='flex cursor-pointer items-start justify-between gap-4 py-4 font-medium' onClick={() => setIsOpen(isOpen === index ? null : index)}>
                            {item.question}
                            {isOpen === index ? <MinusIcon className='size-5 text-gray-500' /> : <PlusIcon className='size-5 text-gray-500' />}
                        </h3>
                        <p className={`pb-4 text-sm/6 text-gray-500 ${isOpen === index ? 'block' : 'hidden'}`}>{item.answer}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}