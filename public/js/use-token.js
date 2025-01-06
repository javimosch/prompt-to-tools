import { ref, computed,onMounted } from "/lib/vue.esm-browser.prod.js";

export default function useToken() {
  const token = ref();

  const setToken = (newToken) => {
    token.value = newToken;
    localStorage.setItem("token", newToken);
  };

    token.value = localStorage.getItem("token") || '';

    console.log("Token set to ",token.value.length);

  const headers = computed(() => ({
    Authorization: `Bearer ${token.value}`,
  }));

  return {
    token,
    setToken,
    headers,
  };
}
