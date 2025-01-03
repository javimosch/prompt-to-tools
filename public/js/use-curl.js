import useToken from "./use-token.js";
import { ref, watch, onMounted } from "/lib/vue.esm-browser.prod.js";
export default function useCurl() {
    const items = ref([]);

    // Function to save items to localStorage
    function saveItemsToLocalStorage(items) {
        localStorage.setItem('items', JSON.stringify(items));
    }

    function useHeaders() {
        const { headers } = useToken();
        return headers.value;
    }

    async function executeCurl(item) {
        console.log('Executing curl for item:', item);
        try {
            const headers = useHeaders();
            const url = new URL(item.baseURL + item.relativeURL);
            
            // Add query parameters
            Object.entries(item.query || {}).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            const response = await fetch(url, {
                method: item.method,
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: item.method !== 'GET' ? JSON.stringify(item.body || {}) : undefined
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Curl execution response:', data);
            
            // Update item with result
            item.result = JSON.stringify(data, null, 2);
            
            return data;
        } catch (error) {
            console.error('Error executing curl:', error);
            item.error = error.message;
            throw error;
        }
    }

    onMounted(() => {
        // Load items from localStorage
        const storedItems = localStorage.getItem('items');
        if (storedItems) {
            items.value = JSON.parse(storedItems);
        }

        window.mitt.on("requestCurlItemComplete", (item) => {
            const headers = useHeaders();
            console.log("requestCurlItemComplete", { item });
            item.fullUrl = new URL(item.baseURL + item.relativeURL)

            item.curlExampleAsHTML = `
      <div>
      curl -X ${item.method} "${item.fullUrl}" \\<br>
      ${headers.Authorization ? `-H "Authorization: ${headers.Authorization}" ` : ''}
      ${Object.entries(item.query).length > 0 ? `\\<br>` + Object.entries(item.query).map(([key, value]) => `-d "${key}=${value}"`).join(' ') : ''}
      </div>
      `

            items.value.push(item);
        });

        window.mitt.on('requestSqlItemComplete', (data) => {
            items.value.push(data);
        });

        function updateOrAddItem(data) {
            const itemToUpdate = items.value.find(item => item.id === data.id);
            if (itemToUpdate) {
                if (itemToUpdate.data) {
                    itemToUpdate.data.push(...data.data);
                } else {
                    Object.assign(itemToUpdate, data);
                }
            } else {
                if (data.baseURL && data.relativeURL) {
                    try {
                        data.fullUrl = new URL(data.baseURL + data.relativeURL);
                    } catch (error) {
                        console.error('Invalid URL', { baseURL: data.baseURL, relativeURL: data.relativeURL });
                    }
                }
                items.value.push(data);
            }
        }

        window.mitt.on('requestTableItemComplete', updateOrAddItem);
        window.mitt.on('requestTableItemPartial', updateOrAddItem);

        window.mitt.on("remove-item", (itemToRemove) => {
            items.value = items.value.filter((item) => JSON.stringify(item) !== JSON.stringify(itemToRemove));
        });

        window.mitt.on("duplicate-item", (itemToDuplicate) => {
            // Find the index of the original item
            const originalIndex = items.value.findIndex(
                item => JSON.stringify(item) === JSON.stringify({ ...itemToDuplicate, title: itemToDuplicate.title.replace(' (Copy)', '') })
            );

            // Insert the copy after the original item
            if (originalIndex !== -1) {
                items.value.splice(originalIndex + 1, 0, itemToDuplicate);
            } else {
                // If original not found (shouldn't happen), just append
                items.value.push(itemToDuplicate);
            }
        });
    });

    // Watch for changes in the items array and persist to localStorage
    watch(items, (newItems) => {
        saveItemsToLocalStorage(newItems);
    }, { deep: true });

    return {
        items,
        executeCurl
    };
}
