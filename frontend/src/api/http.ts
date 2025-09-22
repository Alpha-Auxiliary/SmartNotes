import axios from 'axios';
import { useAuth } from '../stores/auth';

const API_BASE = 'http://localhost:3000/api';
const http = axios.create({ baseURL: API_BASE });

let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

http.interceptors.request.use((config) => {
  const auth = useAuth();
  if (auth.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const auth = useAuth();
    const { response, config } = err || {};
    const status = response?.status;
    const url = (config?.url || '');

    // 不对 auth 接口做刷新，也不在没有 refreshToken 时刷新
    const isAuthApi = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
    const hasRT = !!auth.refreshToken;

    // 若是 409（邮箱已存在）或任意非 401，直接抛出给页面显示
    if (status && status !== 401) return Promise.reject(err);
    // 401 但是 auth 接口 / 没有 RT / 已经重试过，则直接登出并抛出
    if (isAuthApi || !hasRT || config.__isRetryRequest) {
      auth.logout();
      return Promise.reject(err);
    }

    // 走一次刷新流程，且并发请求排队等待同一次刷新
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: auth.refreshToken });
        auth.setTokens(data.accessToken, data.refreshToken);
        isRefreshing = false;
        // 放行排队
        pendingQueue.forEach(fn => fn(data.accessToken));
        pendingQueue = [];
      } else {
        // 等待正在进行的刷新
        await new Promise<void>((resolve) => pendingQueue.push(() => resolve()));
      }

      // 带新 token 重试原请求（只重试一次）
      config.__isRetryRequest = true;
      config.headers.Authorization = `Bearer ${useAuth().accessToken}`;
      return http.request(config);
    } catch (e) {
      isRefreshing = false;
      pendingQueue = [];
      auth.logout();
      return Promise.reject(e);
    }
  }
);

export default http;
