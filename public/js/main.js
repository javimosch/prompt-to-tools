import { createApp, ref } from "/lib/vue.esm-browser.dev.js";
import { useSidebar } from "./use-sidebar.js";
import useSocket from "./use-socket.js";
import useToolItems from "./use-tool-items.js";
import useToken from "./use-token.js";
import CurlItem from './curl-item.js';
import TableItem from './table-item.js';
import GraphItem from './graph-item.js';
import SqlItem from './sql-item.js';
import ItemWrapper from './item-wrapper.js';
import useMainPrompt from "./use-main-prompt.js";
import ChartItem from './chart-item.js';
import { ToastContainer } from "./use-toast.js";

window.mitt = mitt();

const app = createApp({
  setup() {
    useSidebar();
    
    const { socketRef } = useSocket();
    
    const { token, setToken, headers } = useToken();
    const { items, executeCurl } = useToolItems();
    const importText = ref('');
    
    const handleImport = () => {
      if (importText.value) {
        window.mitt.emit('import-item', importText.value);
        importText.value = ''; // Clear input after import
      }
    };

    const handlePaste = (event) => {
      // Let v-model handle the paste
      handleImport();
    };

    const { 
        mainPrompt, 
        output, 
        loading, 
        error, 
        executePrompt, 
        chatHistory,
        threads,
        activeThreadId,
        createThread,
        loadThread,
        deleteThread,
        renameThread,
        canCreateNewThread
    } = useMainPrompt();

    return {
      items,
      token,
      setToken,
      headers,
      executeCurl,
      importText,
      handleImport,
      handlePaste,
      mainPrompt,
      output,
      loading,
      error,
      executePrompt,
      chatHistory,
      threads,
      activeThreadId,
      createThread,
      loadThread,
      deleteThread,
      renameThread,
      socketRef,
      canCreateNewThread
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
