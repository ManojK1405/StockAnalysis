import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const fetchStockNews = async (query) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return [];

    try {
        const cleanQuery = query.split('.')[0];
        
        const response = await axios.get(`https://newsapi.org/v2/everything`, {
            params: {
                q: `${cleanQuery} stock OR Indian market`,
                sortBy: 'publishedAt',
                language: 'en',
                pageSize: 10,
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
