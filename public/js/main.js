import { createApp } from "/lib/vue.esm-browser.prod.js";
import { useSidebar } from "./use-sidebar.js";
import useSocket from "./use-socket.js";
import useCurl from "./use-curl.js";
import useToken from "./use-token.js";
import CurlItem from './curl-item.js';
import TableItem from './table-item.js';
import GraphItem from './graph-item.js';
import SqlItem from './sql-item.js';
import ItemWrapper from './item-wrapper.js';
import useMainPrompt from "./use-main-prompt.js";
import ChartItem from './chart-item.js';
import { useToast, ToastContainer } from "./use-toast.js";

window.mitt = mitt();

const app = createApp({
  setup() {
    useSidebar();
    const {toasts} = useToast();
    const { socketRef } = useSocket();
    
    const { token, setToken, headers } = useToken();
    const { items, executeCurl } = useCurl();
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
      executePrompt,
      toasts,
    };
  },
});

app.component('curl-item', CurlItem);
app.component('table-item', TableItem);
app.component('graph-item', GraphItem);
app.component('sql-item', SqlItem);
app.component('item-wrapper', ItemWrapper);
app.component('chart-item', ChartItem);
app.component('toast-container', ToastContainer);

app.mount(".app");
