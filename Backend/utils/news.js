import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const fetchStockNews = async (symbol, name, sector) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return [];

    try {
        const cleanSymbol = symbol.split('.')[0];
        // Create a precise query including company name, ticker, and sector
        const sectorClause = sector ? ` OR "${sector}" industry` : '';
        const searchQuery = `("${name}" OR "${cleanSymbol}") AND (stock OR earnings OR performance OR market)${sectorClause}`;
        
        const response = await axios.get(`https://newsapi.org/v2/everything`, {
            params: {
                q: searchQuery,
                sortBy: 'relevancy', // Changed from publishedAt for better precision
                language: 'en',
                pageSize: 12,
                apiKey: apiKey
            }
        });

        return response.data.articles.map(art => ({
            title: art.title,
            description: art.description,
            url: art.url,
            source: art.source.name,
            publishedAt: art.publishedAt
        }));
    } catch (error) {
        console.error("NewsAPI Error:", error.response?.data || error.message);
        return [];
    }
};
