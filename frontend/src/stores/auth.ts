import { defineStore } from "pinia";
import http from "../api/http";
import router from "../router";

export const useAuth = defineStore("auth", {
  state: () => ({
    accessToken: localStorage.getItem("at") || "",
    refreshToken: localStorage.getItem("rt") || "",
  }),
  actions: {
    async login(email: string, password: string) {
      const { data } = await http.post("/auth/login", { email, password });
      this.setTokens(data.accessToken, data.refreshToken);
    },
    async register(email: string, password: string) {
      const { data } = await http.post("/auth/register", { email, password });
      this.setTokens(data.accessToken, data.refreshToken);
    },
    async logout() {
      const rt = localStorage.getItem('refreshToken')
      try {
        await http.post('/auth/logout', { refreshToken: rt })
      } finally {
        localStorage.clear()
        router.replace('/login')
        //退出后刷新页面
        location.reload()
  }
    },
    setTokens(at: string, rt: string) {
      this.accessToken = at;
      this.refreshToken = rt;
      localStorage.setItem("at", at);
      localStorage.setItem("rt", rt);
    },
   
  },
});
