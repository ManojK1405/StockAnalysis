import React from 'react';
import { motion } from 'framer-motion';

export default function Privacy() {
    return (
        <div className="bg-white min-h-screen pt-32 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-16"
                >
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 uppercase italic pb-2 leading-tight">
                        Privacy <span className="text-premium">Policy</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Last Updated: April 2026</p>
                </motion.div>

                <div className="prose prose-slate max-w-none space-y-10 text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">1. Data Collection</h2>
                        <p>We collect essential information to provide our research services, including your email address for account management and newsletter delivery. If you link a broker account, we store only the necessary authentication tokens to fetch your portfolio data.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">2. Security</h2>
                        <p>Your data is encrypted using industry-standard protocols. We do not store your raw broker passwords or sensitive financial credentials. Authentication is handled through secure OAuth flows directly with your broker.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">3. Third-Party Sharing</h2>
                        <p>We do not sell your personal information or trading data to third-party marketers. Data is only shared with service providers (like email delivery or cloud hosting) necessary to run the platform.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">4. Cookies</h2>
                        <p>We use session cookies to keep you logged in and to analyze site traffic for improving our AI model performance. You can manage cookie preferences through your browser settings.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
