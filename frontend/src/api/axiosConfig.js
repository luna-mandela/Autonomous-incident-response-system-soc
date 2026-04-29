import axios from 'axios';

// Using a relative baseURL means all requests go through Vite's dev proxy.
// This keeps cookies same-origin and avoids all cross-origin CORS/cookie issues.
const api = axios.create({
  baseURL: '/',
  withCredentials: true,
});

export default api;
