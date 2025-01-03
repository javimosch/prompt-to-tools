import useToken from "./use-token.js";
import { ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
export default function useCurl() {
  const items = ref([
    {
      title: "Example CURL",
      type: "curl",
      baseURL: "",
      relativeURL: "/api/completion",
      method: "POST",
      query: {},
      payload: {
        prompt: "Hi, how are you?",
      },
      result: "",
    },
    {
        title: "Example Table",
        type: "table",
        baseURL: "",
        relativeURL: "/api/completion",
        method: "POST",
        query: {},
        payload: {
          prompt: "Hi, how are you?",
        },
        result: "",
      },
      {
        title: "Example Graph",
        type: "graph",
        baseURL: "",
        relativeURL: "/api/completion",
        method: "POST",
        query: {},
        payload: {
          prompt: "Hi, how are you?",
        },
        result: "",
      },
    // Add more example items here
  ]);

  window.mitt.on("requestCurlItemComplete", (item) => {
    items.value.push(item);
  });

  async function executeCurl(item) {
    const headers = useHeaders();
    const url = new URL(item.relativeURL, window.location.origin);
    Object.entries(item.query).forEach(([key, value]) =>
      url.searchParams.append(key, value)
    );

    try {
      const response = await fetch(url, {
        method: item.method,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      item.result = JSON.stringify(data, null, 2);

      console.log("CURL result:", item.result);
    } catch (error) {
      console.error("Error executing curl:", error);
      item.result = `Error: ${error.message}`;
    }
  }

  function useHeaders() {
    const { headers } = useToken();
    return headers.value;
  }

  return {
    items,
    executeCurl,
  };
}
