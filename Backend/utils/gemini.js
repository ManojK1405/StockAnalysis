import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const FALLBACK_GEMINI_MODELS = [
    process.env.GEMINI_MODEL,
    'models/gemini-2.5-flash',
    'models/gemini-2.5-pro',
    'models/gemini-2.0-flash-lite-001',
    'models/gemini-2.0-flash-001'
].filter(Boolean);

const genAI = new GoogleGenerativeAI(geminiApiKey);
let activeGeminiModel = FALLBACK_GEMINI_MODELS[0] || null;

const getModel = (modelName = activeGeminiModel) => {
    if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY not set');
    }
    if (!modelName) {
        throw new Error('No Gemini model configured');
    }
    return genAI.getGenerativeModel({ model: modelName });
};

const tryGemini = async (executor) => {
    let lastError;

    for (const modelName of FALLBACK_GEMINI_MODELS) {
        activeGeminiModel = modelName;
        try {
            return await executor(getModel(modelName));
        } catch (error) {
            lastError = error;
            const message = String(error?.message || '').toLowerCase();
            const status = error?.status;

            const isModelNotFound = status === 404 || message.includes('not found') || message.includes('no longer available') || message.includes('is not found for api version');
            if (isModelNotFound) {
                console.warn(`[Gemini] model ${modelName} invalid, trying fallback.`, message);
                continue;
            }

            throw error;
        }
    }

    throw lastError;
};

export const generateGeminiText = async (prompt) => {
    if (!geminiApiKey || FALLBACK_GEMINI_MODELS.length === 0) {
        throw new Error('Gemini configuration unavailable');
    }

    return await tryGemini(async (model) => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    });
};

/**
 * Analyzes sentiment using FinBERT models via Hugging Face Inference API.
 * Tries multiple models as fallbacks to ensure reliability.
 */
export const getFinBERTSentiment = async (headlines) => {
    const hfToken = process.env.HF_API_TOKEN;
    if (!hfToken || !headlines.length) return null;

    const models = [
        "ProsusAI/finbert",
        "yiyanghkust/finbert-tone",
        "mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis"
    ];

    const text = headlines.join(". ");

    for (const model of models) {
        try {
            const response = await axios.post(
                `https://api-inference.huggingface.co/models/${model}`,
                { inputs: text, options: { wait_for_model: true } },
                { headers: { Authorization: `Bearer ${hfToken}` } }
            );

            const results = response.data;

            // Handle different output formats (some return nested arrays, others single)
            let scores = Array.isArray(results[0]) ? results[0] : results;

            if (scores && scores.length) {
                // Normalize labels as different models use slightly different names (positive/neutral/negative)
                const getScore = (labelPart) => {
                    const found = scores.find(s => s.label.toLowerCase().includes(labelPart.toLowerCase()));
                    return found ? found.score : 0;
                };

                const pos = getScore('pos');
                const neg = getScore('neg');
                console.log(`[Sentiment] Successfully used FinBERT model: ${model}`);
                return pos - neg;
            }
        } catch (error) {
            // Only log if it's the last one or not a 404
            if (error.response?.status !== 404) {
                console.warn(`[Sentiment] Model ${model} failed: ${error.message}`);
            }
            continue;
        }
    }

    return null;
};

export const getNewsSentiment = async (headlines) => {
    if (!headlines || headlines.length === 0) return 0;

    // 1. Try FinBERT first
    const finbertScore = await getFinBERTSentiment(headlines);
    if (finbertScore !== null) {
        console.log(`[Sentiment] Using FinBERT score: ${finbertScore.toFixed(2)}`);
        return finbertScore;
    }

    // 2. Fallback to Gemini
    try {
        const prompt = `
            Analyze the following news headlines related to a stock and provide a combined sentiment score between -1 and 1.
            -1 means extremely negative. 0 means neutral. 1 means extremely positive.
            Return ONLY the numerical score.
            
            Headlines:
            ${headlines.join('\n- ')}
        `;

        const text = await generateGeminiText(prompt);
        const score = parseFloat(text);
        return isNaN(score) ? 0 : score;
    } catch (error) {
        console.error("Gemini Sentiment Error:", error);
        return 0;
    }
};

export const getAIPredictionReasoning = async (symbol, indicators, sentiment, trendAnalysis) => {
    if (!process.env.GEMINI_API_KEY) return "Technical indicators show a trend based on market volume.";

    try {
        // ── Derive all context variables from available data ──────────────
        const ta = trendAnalysis || {};
        const overall = ta.overall || {};
        const vol = ta.volume || {};
        const mom = ta.momentum || {};
        const sr = ta.supportResistance || {};
        const bb = ta.indicators?.bollingerBands || {};
        const macdInd = ta.indicators?.macd || {};
        const rsiInd = ta.indicators?.rsi || {};

        const marketTrend = `${overall.direction || 'N/A'} (${overall.strength || 'N/A'})`;
        const relativeStrength = (mom.value || 0) > 5 ? 'Outperforming' : (mom.value || 0) < -5 ? 'Underperforming' : 'In-line';
        const beta = 'Refer fundamentals';
        const bbWidth = bb.upper && bb.lower && bb.middle
            ? ((bb.upper - bb.lower) / bb.middle * 100).toFixed(1) : 'N/A';
        const volatilityRegime = bbWidth !== 'N/A'
            ? (parseFloat(bbWidth) > 8 ? `High (BB Width: ${bbWidth}%)` : parseFloat(bbWidth) < 4 ? `Low (BB Width: ${bbWidth}%)` : `Normal (BB Width: ${bbWidth}%)`)
            : 'N/A';
        const smaContext = overall.description || 'SMA data pending';
        const higherHighs = overall.direction === 'uptrend';
        const keyLevels = `S1: ₹${sr.support1 || 'N/A'} | R1: ₹${sr.resistance1 || 'N/A'} | S2: ₹${sr.support2 || 'N/A'}`;
        const atr = bbWidth !== 'N/A' ? `Implied from BB Width ${bbWidth}%` : 'N/A';
        const macdHist = indicators.macd?.histogram || macdInd.histogram || 0;
        const macdHistTrend = macdHist > 0.5 ? 'Expanding positive' : macdHist > 0 ? 'Narrowing positive' : macdHist > -0.5 ? 'Narrowing negative' : 'Expanding negative';
        const volumeContext = vol.trend ? `${vol.trend} (${vol.change || 0}% vs prior 5 sessions)` : 'N/A';
        const smartMoneyFlow = (vol.trend === 'increasing' && overall.direction === 'uptrend') ? 'Accumulation signals'
            : (vol.trend === 'increasing' && overall.direction === 'downtrend') ? 'Distribution signals' : 'No clear institutional flow';
        const newsSummary = sentiment > 0.3 ? 'Positive media cycle' : sentiment < -0.3 ? 'Negative media headwinds' : 'Neutral news flow';
        const upcomingEvents = 'None flagged';
        const rsiVal = indicators.rsi || rsiInd.value || 50;
        const macdBullish = (indicators.macd?.MACD || 0) > (indicators.macd?.signal || 0);
        const trendScore = Math.min(100, Math.max(0,
            (overall.direction === 'uptrend' ? 40 : overall.direction === 'downtrend' ? 10 : 25) +
            (rsiVal > 50 ? 20 : 5) + (macdBullish ? 20 : 5) + (sentiment > 0 ? 15 : sentiment < 0 ? 0 : 8)
        ));
        const momentumConfirmation = (macdBullish && rsiVal > 50) ? 'CONFIRMS – Momentum aligns with trend'
            : (!macdBullish && rsiVal < 50) ? 'CONFIRMS – Bearish momentum aligns' : 'DIVERGES – Momentum conflicts with price';
        const smartMoneyBias = (vol.trend === 'increasing' && overall.direction === 'uptrend') ? 'Bullish accumulation'
            : (vol.trend === 'decreasing' && overall.direction === 'downtrend') ? 'Bearish exhaustion' : 'Neutral / Inconclusive';
        const riskRegime = volatilityRegime.includes('High') ? 'ELEVATED' : volatilityRegime.includes('Low') ? 'COMPRESSED' : 'STANDARD';

        const prompt = `
            Act as a SEBI-registered senior equity research analyst with a hybrid approach combining technical, quantitative, and behavioral finance insights. Produce a high-conviction, data-driven micro research note.

            Stock: ${symbol}
            Signal Bias: ${sentiment > 0 ? 'BULLISH' : sentiment < 0 ? 'BEARISH' : 'NEUTRAL'}

            === MARKET CONTEXT ===
            - Index Trend (NIFTY/Sector): ${marketTrend}
            - Relative Strength vs Index: ${relativeStrength}
            - Beta: ${beta}
            - Volatility Regime: ${volatilityRegime}

            === TECHNICAL STRUCTURE ===
            - Price vs SMA (20/50/200): ${smaContext}
            - Trend Structure: ${higherHighs ? 'HH-HL (Uptrend)' : 'LH-LL (Downtrend)'}
            - Key Support/Resistance Zones: ${keyLevels}
            - ATR (14): ${atr}

            === MOMENTUM & FLOW ===
            - RSI (14): ${rsiVal.toFixed(2)}
            - RSI Regime: ${rsiVal > 60 ? 'Bullish Range' : rsiVal < 40 ? 'Bearish Range' : 'Neutral Range'}
            - MACD State: ${macdBullish ? 'Bullish Crossover' : 'Bearish Crossover'}
            - MACD Histogram Trend: ${macdHistTrend}
            - Volume vs 20D Avg: ${volumeContext}
            - Delivery % / Institutional Activity (if available): ${smartMoneyFlow}

            === SENTIMENT & NEWS FLOW ===
            - News Sentiment Score: ${sentiment.toFixed(2)} (-1 to +1)
            - Recent Narrative: ${newsSummary}
            - Event Risk: ${upcomingEvents}

            === DERIVED INSIGHTS ===
            - Trend Strength Score (0-100): ${trendScore}
            - Momentum Confirmation: ${momentumConfirmation}
            - Smart Money Bias: ${smartMoneyBias}
            - Risk Regime: ${riskRegime}

            ---

            Write EXACTLY 5 sections with deep insight:

            1. **Trend & Structure**
            - Analyze trend strength using SMA alignment, HH/HL or LH/LL structure, and relative strength vs index.
            - Explain *what is driving the trend structurally*, not just direction.

            2. **Momentum Validation**
            - Combine RSI regime + MACD + histogram slope.
            - Clearly state whether momentum CONFIRMS, LEADS, or DIVERGES from price.

            3. **Volume, Flow & Sentiment**
            - Integrate volume behavior, delivery/institutional signals, and news sentiment.
            - Infer whether accumulation, distribution, or exhaustion is occurring.

            4. **Risk-Reward & Fragility**
            - Highlight asymmetric opportunity or lack of it.
            - Define *invalidation conditions* (trend breaks, momentum failure, volatility expansion).

            5. **Investment Verdict**
            - Based on ALL the above data, clearly state whether this stock is suitable for:
              (a) Short-term trading (Swing): FAVORABLE / NEUTRAL / AVOID — with 1 reason.
              (b) Medium-term investment (3-12 months): FAVORABLE / NEUTRAL / AVOID — with 1 reason.
              (c) Long-term portfolio (1+ years): FAVORABLE / NEUTRAL / AVOID — with 1 reason.

            ---

            Strict Rules:
            - Use precise numbers (RSI, ATR, % deviations, etc.).
            - No generic statements — every line must add informational edge.
            - Avoid retail clichés (e.g., "strong buy", "good stock").
            - Write like a hedge fund note: concise, sharp, insight-heavy.
            - Max 2 sentences per bullet (section 5 can have 3 sub-lines).
            - No direct trade recommendations (no entry/exit prices).
        `;

        return await generateGeminiText(prompt);
    } catch (error) {
        console.error("Gemini Reasoning Error:", error);
        return "Analysis suggests a potential move based on current RSI levels.";
    }
};

export const getAIStrategy = async (prompt) => {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

    const attempt = async () => {
        const text = await generateGeminiText(prompt);
        return text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    };

    try {
        return await attempt();
    } catch (err) {
        const is429 = err?.message?.includes('429') || err?.status === 429;
        if (is429) {
            const match = err.message?.match(/retryDelay":"(\d+)s"/);
            const waitMs = Math.min((parseInt(match?.[1] || '10') + 2) * 1000, 32000);
            console.warn(`[Gemini] 429 – retrying after ${waitMs / 1000}s…`);
            await new Promise(r => setTimeout(r, waitMs));
            return await attempt();
        }
        throw err;
    }
};

/**
 * Extracts a stock symbol from a natural language query using Gemini AI.
 * @param {string} query - The user's search query (e.g. "Reliance industries", "Show me TCS price")
 * @returns {Promise<string|null>} - The extracted symbol (e.g. "RELIANCE.NS") or null
 */
export const extractStockSymbol = async (query) => {
    if (!process.env.GEMINI_API_KEY) return null;

    try {
        const prompt = `
            Your task is to identify a specific stock symbol based on the user's query.
            
            Query: "${query}"
            
            Guidelines:
            1. If the query mentions a specific company (e.g., "Reliance", "Tata Motors", "Apple"), find its primary trading symbol.
            2. If the query is descriptive (e.g., "biggest market cap stock in India", "largest tech company"), identify the relevant stock (e.g., RELIANCE.NS, AAPL).
            3. For Indian stocks, ALWAYS append the ".NS" suffix for NSE (e.g., TCS.NS, SBIN.NS).
            4. For US stocks, use the standard ticker (e.g., TSLA, MSFT).
            5. Return ONLY the symbol string. Do not include any explanation or punctuation.
            6. If you cannot identify a specific stock, return "NULL".
            
            Target Symbol:
        `;

        const text = await generateGeminiText(prompt);
        const symbol = text.trim().split(' ')[0].replace(/[^A-Za-z0-9.]/g, ''); // Clean any hallucinations

        if (!symbol || symbol.toUpperCase() === "NULL") return null;
        return symbol.toUpperCase();
    } catch (error) {
        console.error("Gemini Symbol Extraction Error:", error);
        return null;
    }
};

