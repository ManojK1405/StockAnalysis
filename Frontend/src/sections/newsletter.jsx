import SectionTitle from '../components/section-title';
import React, { useState } from 'react';
import api from '../api';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await api.post('/newsletter/subscribe', { email });
            setSuccess(true);
            setEmail('');
        } catch (err) {
            console.error(err);
            alert('Subscription failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className='flex flex-col items-center justify-center mt-40'>
            <SectionTitle title='The Intelligence Brief' subtitle='Join 50k+ systematic investors. Get deep market insights and AI-driven alerts delivered to your inbox.' />

            <form onSubmit={handleSubscribe} className='flex bg-slate-100 text-sm p-1 rounded-full w-full max-w-xl my-10 border-2 border-white ring ring-slate-200'>
                <input 
                    className='flex-1 rounded-full pl-5 max-md:py-3 outline-none bg-transparent' 
                    type='email' 
                    placeholder={success ? 'Subscribed!' : 'Enter your email address'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={success || loading}
                />
                <button 
                    type="submit"
                    disabled={loading || success}
                    className='font-medium hidden md:block btn text-white px-7 py-3 rounded-full hover:opacity-90 active:scale-95 transition disabled:opacity-50'
                >
                    {loading ? '...' : success ? 'Saved' : 'Get Updates'}
                </button>
            </form>
            <button 
                onClick={handleSubscribe}
                disabled={loading || success}
                className='font-medium md:hidden btn text-white px-7 py-3 rounded-full hover:opacity-90 active:scale-95 transition disabled:opacity-50'
            >
                {loading ? '...' : success ? 'Saved' : 'Get Updates'}
            </button>
        </section>
    );
}
