import { ref, computed } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";

export default function useToken() {
  const token = ref(localStorage.getItem("token") || "");

  const setToken = (newToken) => {
    token.value = newToken;
    localStorage.setItem("token", newToken);
  };

  const headers = computed(() => ({
    Authorization: `Bearer ${token.value}`,
  }));

  return {
    token,
    setToken,
    headers,
  };
}
