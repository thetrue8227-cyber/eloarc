import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) return Promise.reject(new Error('no_refresh_token'));
  refreshPromise = axios.post('/api/auth/refresh', { refresh_token })
    .then(({ data }) => {
      localStorage.setItem('access_token', data.access_token);
      return data.access_token;
    })
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (!original || original._retry) return Promise.reject(err);

    if (err.response?.status === 401) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return Promise.reject(err);
  }
);

export default api;
