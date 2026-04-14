import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => {
    // gemini-2.0-flash-lite has a separate, higher free-tier quota
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
};

export const getNewsSentiment = async (headlines) => {
    if (!headlines || headlines.length === 0) return 0;

    try {
        const model = getModel();

        const prompt = `
            Analyze the following news headlines related to a stock and provide a combined sentiment score between -1 and 1.
            -1 means extremely negative. 0 means neutral. 1 means extremely positive.
            Return ONLY the numerical score.
            
            Headlines:
            ${headlines.join('\n- ')}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
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
        const model = getModel();

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Gemini Reasoning Error:", error);
        return "Analysis suggests a potential move based on current RSI levels.";
    }
};

export const getAIStrategy = async (prompt) => {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');
    const model = getModel();

    // Retry once on 429 after the suggested delay (capped at 30s)
    const attempt = async () => {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        return text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    };

    try {
        return await attempt();
    } catch (err) {
        const is429 = err?.message?.includes('429') || err?.status === 429;
        if (is429) {
            // Extract retryDelay from error message if present, cap at 30s
            const match = err.message?.match(/retryDelay":"(\d+)s"/);
            const waitMs = Math.min((parseInt(match?.[1] || '10') + 2) * 1000, 32000);
            console.warn(`[Gemini] 429 – retrying after ${waitMs / 1000}s…`);
            await new Promise(r => setTimeout(r, waitMs));
            return await attempt();
        }
        throw err;
    }
};
