import { createApp } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
import { useSidebar } from "./use-sidebar.js";
import useSocket from "./use-socket.js";
import useCurl from "./use-curl.js";
import useToken from "./use-token.js";
import CurlItem from './curl-item.js';
import TableItem from './table-item.js';
import GraphItem from './graph-item.js';
import useMainPrompt from "./use-main-prompt.js";

window.mitt = mitt();

const app = createApp({
  setup() {
    useSidebar();
    const { socketRef } = useSocket();
    const { items, executeCurl } = useCurl();
    const { token, setToken, headers } = useToken();
    const { mainPrompt, output, loading, error, executePrompt } = useMainPrompt();

    return {
      items,
      executeCurl,
      token,
      setToken,
      headers,
      socketRef,
      mainPrompt,
      output,
      loading,
      error,
      executePrompt
    };
  },
});


app.component('curl-item', CurlItem);
app.component('table-item', TableItem);
app.component('graph-item', GraphItem);

app.mount(".app");
