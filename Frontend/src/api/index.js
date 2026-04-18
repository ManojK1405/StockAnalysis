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
export const generateReverseStrategy = (params) => API.post('/strategy/reverse', params);
export const saveStrategyAction = (payload) => API.post('/strategy/saved', payload);
export const getSavedStrategies = () => API.get('/strategy/saved');
export const deleteSavedStrategy = (id) => API.delete(`/strategy/saved/${id}`);
export const updateSavedStrategy = (id, payload) => API.put(`/strategy/saved/${id}`, payload);

export const syncBroker = (payload) => API.post('/portfolio/broker-sync', payload);
export const executeStrategy = (payload) => API.post('/portfolio/execute-strategy', payload);

export default API;
