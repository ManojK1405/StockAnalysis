import { GoogleGenerativeAI } from "@google/generative-ai";
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

const generateGeminiText = async (prompt) => {
    if (!geminiApiKey || FALLBACK_GEMINI_MODELS.length === 0) {
        throw new Error('Gemini configuration unavailable');
    }

    return await tryGemini(async (model) => {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    });
};

export const getNewsSentiment = async (headlines) => {
    if (!headlines || headlines.length === 0) return 0;

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
        const trendCtx = trendAnalysis ? `
            - Trend: ${trendAnalysis.overall.direction} (${trendAnalysis.overall.strength})
            - Volume: ${trendAnalysis.volume.trend} (${trendAnalysis.volume.change || 0}% change)
            - Momentum (10-day ROC): ${trendAnalysis.momentum.value}%
            - Bollinger Band Position: ${trendAnalysis.indicators.bollingerBands.position}%
            - Support (S1): ₹${trendAnalysis.supportResistance.support1}
            - Resistance (R1): ₹${trendAnalysis.supportResistance.resistance1}
        ` : '';

        const prompt = `
            Act as a senior SEBI-registered equity research analyst writing a brief but insightful analysis note.
            
            Stock: ${symbol}
            Signal: ${sentiment > 0 ? 'BUY' : sentiment < 0 ? 'SELL' : 'NEUTRAL'}
            
            Technical Data:
            - RSI (14): ${indicators.rsi.toFixed(2)}
            - MACD vs Signal: ${indicators.macd?.MACD > indicators.macd?.signal ? 'Bullish crossover' : 'Bearish divergence'}
            - MACD Histogram: ${indicators.macd?.histogram?.toFixed(2) || 'N/A'}
            - News Sentiment Score: ${sentiment.toFixed(2)} (scale: -1 to +1)
            ${trendCtx}
            
            Write exactly 4 bullet points that cover:
            1. The primary trend and what's driving it (mention SMA alignment, price action)
            2. Momentum assessment using RSI & MACD together — whether momentum confirms or diverges from price
            3. Volume and sentiment context — whether smart money appears to be accumulating or distributing
            4. Risk/reward summary — key levels to watch and what could invalidate this thesis
            
            Rules:
            - Be specific with numbers. Reference actual indicator values.
            - Do NOT say "buy at X" or "sell at Y" — explain the WHY.
            - Max 2 sentences per bullet.
            - Use a professional yet accessible tone.
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
