import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5001/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export const login = (formData) => API.post('/auth/login', formData);
export const signup = (formData) => API.post('/auth/signup', formData);
export const getWatchlist = () => API.get('/portfolio/watchlist');
export const addToWatchlist = (symbol) => API.post('/portfolio/watchlist', { symbol });
export const removeFromWatchlist = (id) => API.delete(`/portfolio/watchlist/${id}`);
export const getPortfolio = () => API.get('/portfolio/portfolio');
export const addPortfolioItem = (item) => API.post('/portfolio/portfolio', item);
export const getPrediction = (symbol) => API.get(`/predictions/${symbol}`);
export const generateStrategy = (params) => API.post('/strategy/generate', params);
export const getIntradayPulse = (params) => API.post('/strategy/intraday', params);

export default API;
