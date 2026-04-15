import React, { useState } from 'react';
import {
  Target, Wallet, TrendingUp, ShieldCheck, Briefcase, ChevronRight,
  Sparkles, RefreshCw, AlertTriangle, BarChart2, Clock, Layers,
  CheckCircle2, XCircle, ArrowRight, Globe2, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStrategy } from '../api/index.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const RISK_LEVELS = [
  {
    id: 'conservative',
    label: 'Conservative',
    icon: ShieldCheck,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    desc: 'Capital preservation. Mostly debt & gold.',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    icon: BarChart2,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    desc: 'Balanced growth. Mix of equity and safety.',
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    icon: TrendingUp,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    desc: 'Maximum returns. High equity, high volatility.',
  },
];

const SECTORS = [
  { id: 'any',            label: 'No Preference',  emoji: '🌐' },
  { id: 'technology',     label: 'Technology',      emoji: '💻' },
  { id: 'banking',        label: 'Banking',         emoji: '🏦' },
  { id: 'pharma',         label: 'Pharma',          emoji: '💊' },
  { id: 'energy',         label: 'Energy',          emoji: '⚡' },
  { id: 'consumer',       label: 'Consumer',        emoji: '🛒' },
  { id: 'auto',           label: 'Auto',            emoji: '🚗' },
  { id: 'realestate',     label: 'Real Estate',     emoji: '🏘️' },
  { id: 'infrastructure', label: 'Infrastructure',  emoji: '🏗️' },
];

const HORIZONS = [
  { id: 'short',  label: 'Short Term',  sub: '3–6 months', icon: Clock },
  { id: 'medium', label: 'Medium Term', sub: '1–2 years',  icon: BarChart2 },
  { id: 'long',   label: 'Long Term',   sub: '3–5 years',  icon: TrendingUp },
];

const TYPE_META = {
  stock: { label: 'Stock',     color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  etf:   { label: 'ETF',      color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  gold:  { label: 'Gold',     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  debt:  { label: 'Debt',     color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  cash:  { label: 'Buffer',   color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
};

const RISK_COLOR = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

// ─── Helper Components ────────────────────────────────────────────────────────

function StepDot({ step, current }) {
  const done = current > step;
  const active = current === step;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: done ? '#6366f1' : active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
        border: `2px solid ${done || active ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: done || active ? (done ? '#fff' : '#6366f1') : '#64748b',
        transition: 'all 0.3s ease',
      }}>
        {done ? <CheckCircle2 size={16} /> : step}
      </div>
    </div>
  );
}

function AllocBar({ allocation }) {
  const colorMap = { stock: '#6366f1', etf: '#3b82f6', gold: '#f59e0b', debt: '#10b981', cash: '#94a3b8' };
  return (
    <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
      {allocation.map((item, i) => (
        <div key={i} title={`${item.displayName}: ${item.weight}%`} style={{
          width: `${item.weight}%`, background: colorMap[item.type] || '#6366f1',
          borderRadius: i === 0 ? '99px 0 0 99px' : i === allocation.length - 1 ? '0 99px 99px 0' : 0,
          transition: 'width 0.6s ease',
        }} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Strategist = () => {
  const [step, setStep] = useState(1);
  const [amount, setAmount]       = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [sector, setSector]       = useState('any');
  const [horizon, setHorizon]     = useState('medium');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [strategy, setStrategy]   = useState(null);

  const formatINR = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  const handleGenerate = async () => {
    if (!amount || !riskLevel) return;
    setLoading(true);
    setError('');
    setStrategy(null);

    try {
      const res = await generateStrategy({ amount: parseFloat(amount), riskLevel, sector, horizon });
      setStrategy(res.data);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1); setAmount(''); setRiskLevel('');
    setSector('any'); setHorizon('medium');
    setStrategy(null); setError('');
  };

  // ── Shared card style
  const card = {
    background: 'rgba(15,23,42,0.92)',
    border: '1px solid rgba(148,163,184,0.18)',
    borderRadius: 20,
    padding: '28px 32px',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', letterSpacing: -1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Sparkles color="#6366f1" size={32} />
          AI Investment Strategist
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
          Answer 3 quick questions. Get a live market-backed strategy — no templates, no guesswork.
        </p>
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <StepDot step={s} current={step} />
              {i < 2 && (
                <div style={{
                  flex: 1, height: 2,
                  background: step > s ? '#6366f1' : 'rgba(255,255,255,0.07)',
                  transition: 'background 0.4s',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Amount ─────────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <Wallet color="#6366f1" size={22} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>How much do you want to invest?</h2>
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 22, fontWeight: 700, color: '#6366f1',
                }}>₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(99,102,241,0.3)',
                    borderRadius: 14, padding: '18px 18px 18px 46px',
                    fontSize: 28, fontWeight: 800, color: '#f1f5f9', outline: 'none',
                  }}
                  onKeyDown={e => e.key === 'Enter' && amount && setStep(2)}
                />
              </div>

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                {[5000, 25000, 50000, 100000, 500000].map(v => (
                  <button key={v}
                    onClick={() => setAmount(String(v))}
                    style={{
                      padding: '8px 16px', borderRadius: 99, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: parseFloat(amount) === v ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${parseFloat(amount) === v ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                      color: parseFloat(amount) === v ? '#a5b4fc' : '#94a3b8', transition: 'all 0.2s',
                    }}
                  >
                    {v >= 100000 ? `₹${v / 100000}L` : `₹${v / 1000}K`}
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(2)} disabled={!amount || parseFloat(amount) <= 0}
                style={{
                  marginTop: 28, width: '100%', padding: '16px', borderRadius: 14, cursor: 'pointer',
                  background: amount && parseFloat(amount) > 0 ? 'linear-gradient(135deg,#6366f1,#818cf8)' : 'rgba(255,255,255,0.06)',
                  border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.3s', opacity: !amount || parseFloat(amount) <= 0 ? 0.4 : 1,
                }}
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Risk + Sector ───────────────────────────────────────── */}
        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Risk level */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <ShieldCheck color="#6366f1" size={22} />
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>What's your risk appetite?</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {RISK_LEVELS.map(r => {
                    const Icon = r.icon;
                    const active = riskLevel === r.id;
                    return (
                      <button key={r.id} onClick={() => setRiskLevel(r.id)} style={{
                        padding: '20px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                        background: active ? r.bg : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${active ? r.border : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all 0.25s', transform: active ? 'scale(1.02)' : 'scale(1)',
                      }}>
                        <Icon size={22} color={active ? r.color : '#475569'} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: active ? r.color : '#94a3b8', marginTop: 10 }}>{r.label}</p>
                        <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4, lineHeight: 1.4 }}>{r.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred sector */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Globe2 color="#6366f1" size={22} />
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>Preferred sector?</h2>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#cbd5e1' }}>Optional</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {SECTORS.map(s => {
                    const active = sector === s.id;
                    return (
                      <button key={s.id} onClick={() => setSector(s.id)} style={{
                        padding: '12px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                        background: active ? 'rgba(99,102,241,0.16)' : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${active ? '#6366f1' : 'rgba(148,163,184,0.18)'}`,
                        color: active ? '#eef2ff' : '#cbd5e1', fontSize: 13, fontWeight: 600,
                        transition: 'all 0.2s',
                      }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</div>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(1)} style={{
                  padding: '14px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b',
                }}>Back</button>
                <button onClick={() => setStep(3)} disabled={!riskLevel} style={{
                  flex: 1, padding: '14px', borderRadius: 12, cursor: 'pointer', fontSize: 16, fontWeight: 700,
                  background: riskLevel ? 'linear-gradient(135deg,#6366f1,#818cf8)' : 'rgba(255,255,255,0.05)',
                  border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: !riskLevel ? 0.4 : 1, transition: 'all 0.3s',
                }}>
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Horizon + Generate ──────────────────────────────────── */}
        {step === 3 && (
          <motion.div key="step3"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Clock color="#6366f1" size={22} />
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>How long do you plan to stay invested?</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {HORIZONS.map(h => {
                    const Icon = h.icon;
                    const active = horizon === h.id;
                    return (
                      <button key={h.id} onClick={() => setHorizon(h.id)} style={{
                        padding: '20px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                        background: active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                        transition: 'all 0.25s',
                      }}>
                        <Icon size={22} color={active ? '#6366f1' : '#475569'} style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: active ? '#a5b4fc' : '#94a3b8' }}>{h.label}</p>
                        <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>{h.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary card */}
              <div style={{ ...card, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#a5b4fc', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Your Profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Amount', val: formatINR(parseFloat(amount) || 0), icon: Wallet },
                    { label: 'Risk', val: RISK_LEVELS.find(r => r.id === riskLevel)?.label || '—', icon: ShieldCheck },
                    { label: 'Sector', val: SECTORS.find(s => s.id === sector)?.label || 'Any', icon: Globe2 },
                    { label: 'Horizon', val: HORIZONS.find(h => h.id === horizon)?.sub || '—', icon: Clock },
                  ].map(({ label, val, icon: Icon }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={16} color="#6366f1" />
                      <div>
                        <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#eff6ff' }}>{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  <XCircle size={18} color="#ef4444" /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setStep(2)} style={{
                  padding: '14px 24px', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b',
                }}>Back</button>
                <button onClick={handleGenerate} disabled={loading} style={{
                  flex: 1, padding: '16px', borderRadius: 12, cursor: loading ? 'wait' : 'pointer', fontSize: 16, fontWeight: 700,
                  background: 'linear-gradient(135deg,#6366f1,#818cf8)', border: 'none', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 8px 32px rgba(99,102,241,0.35)', transition: 'opacity 0.3s',
                  opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? (
                    <>
                      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Fetching live data &amp; generating…
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Generate AI Strategy
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: Results ─────────────────────────────────────────────── */}
        {step === 4 && strategy && (
          <motion.div key="step4"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Hero banner */}
              <div style={{
                ...card,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(59,130,246,0.10) 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#6366f1' }}>
                      AI-Generated Strategy
                    </span>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', marginTop: 6, marginBottom: 10 }}>
                      {strategy.strategyTitle}
                    </h2>
                    <p style={{ color: '#cbd5e1', lineHeight: 1.65, maxWidth: 560, fontSize: 15 }}>
                      {strategy.summary}
                    </p>
                  </div>
                  <button onClick={reset} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <RefreshCw size={14} /> New Strategy
                  </button>
                </div>

                {/* KPI strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 24 }}>
                  {[
                    { label: 'Total Invested', val: formatINR(strategy.inputParams?.amount || 0), icon: Wallet, color: '#6366f1' },
                    { label: 'Risk Level',     val: strategy.riskScore,    icon: ShieldCheck, color: RISK_COLOR[strategy.riskScore] || '#6366f1' },
                    { label: 'Target Return',  val: strategy.projectedReturnRange, icon: TrendingUp, color: '#10b981' },
                    { label: 'Horizon',        val: strategy.horizon,      icon: Clock, color: '#f59e0b' },
                  ].map(({ label, val, icon: Icon, color }) => (
                    <div key={label} style={{
                      background: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: '14px 16px',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <Icon size={15} color={color} />
                      <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', marginTop: 8 }}>{label}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color, marginTop: 2 }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* Market snapshot */}
                {strategy.marketSnapshot && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 18 }}>
                    {[
                      { label: 'Nifty 50 (30d)', val: strategy.marketSnapshot.nifty50_30d },
                      { label: 'Bank Nifty (30d)', val: strategy.marketSnapshot.bankNifty_30d },
                      { label: `Top Mover: ${strategy.marketSnapshot.topMover}`, val: strategy.marketSnapshot.topMoverReturn },
                    ].filter(x => x.val != null).map(({ label, val }) => (
                      <div key={label} style={{
                        padding: '8px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                        background: val >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        border: `1px solid ${val >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                        color: val >= 0 ? '#34d399' : '#f87171',
                      }}>
                        {label}: {val > 0 ? '+' : ''}{val}%
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Allocation bar */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Briefcase color="#6366f1" size={20} />
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Recommended Allocation</h3>
                </div>
                <AllocBar allocation={strategy.allocation} />
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, marginBottom: 24 }}>
                  {Object.entries(TYPE_META).map(([type, meta]) =>
                    strategy.allocation.some(a => a.type === type) ? (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: meta.color }} />
                        {meta.label}
                      </div>
                    ) : null
                  )}
                </div>

                {/* Allocation cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {strategy.allocation.map((item, i) => {
                    const typeMeta = TYPE_META[item.type] || TYPE_META.stock;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 20px',
                          borderRadius: 16, background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        {/* Weight pie */}
                        <div style={{
                          minWidth: 60, height: 60, borderRadius: 16,
                          background: typeMeta.bg, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: 2,
                        }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: typeMeta.color }}>{item.weight}%</span>
                          <span style={{ fontSize: 9, fontWeight: 700, color: typeMeta.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {typeMeta.label}
                          </span>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{item.displayName}</h4>
                            <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{item.name}</span>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                              background: `${RISK_COLOR[item.risk]}18`,
                              color: RISK_COLOR[item.risk] || '#94a3b8',
                            }}>
                              {item.risk} Risk
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: '#64748b', marginTop: 6, lineHeight: 1.55 }}>{item.reason}</p>
                        </div>

                        <div style={{ textAlign: 'right', minWidth: 'max-content' }}>
                          <p style={{ fontSize: 18, fontWeight: 800, color: '#eff6ff' }}>{formatINR(item.amount)}</p>
                          <p style={{ fontSize: 11, color: '#475569', marginTop: 2, textTransform: 'uppercase', fontWeight: 600 }}>to invest</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom row: market outlook + risks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <Layers color="#6366f1" size={18} />
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Market Outlook</h3>
                  </div>
                  <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.65 }}>{strategy.marketOutlook}</p>
                  <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>Rebalance Tip</p>
                    <p style={{ fontSize: 13, color: '#cbd5e1' }}>{strategy.rebalanceAdvice}</p>
                  </div>
                </div>

                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <AlertTriangle color="#f59e0b" size={18} />
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>Key Risks</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(strategy.keyRisks || []).map((risk, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          minWidth: 22, height: 22, borderRadius: 99, background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#f59e0b', marginTop: 1,
                        }}>
                          {i + 1}
                        </div>
                        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Disclaimer */}
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
                ⚠️ This AI-generated strategy uses live market data and is for educational purposes only. It is not SEBI-registered investment advice. Past returns are not indicative of future performance. Always consult a certified financial advisor before investing.
              </p>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Strategist;
