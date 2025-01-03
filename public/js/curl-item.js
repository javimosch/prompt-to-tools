import useToken from "./use-token.js";
export default {
    props: ['item'],
    template: `
    <div class="curl-item p-4 border rounded">
      
      <span class="font-bold text-blue-600">{{item.title}}</span>
      <button @click="removeItem" class="float-right bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600">Remove</button>
      <h4 class="text-md font-medium">{{ item.method }} {{ item.fullUrl }}</h4>
      
        <div style="max-height: 100px; overflow-y: auto;" class="bg-gray-100 p-2 rounded break-words" v-html="item.curlExampleAsHTML">
        </div>
      
      <div class="flex gap-2 mt-2">
        <button @click="executeCurl(item)" class="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600">Execute</button>
        <button @click="copyCurlToClipboard" class="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600">Copy cURL to clipboard</button>
        <button v-show="item.result" @click="copyResultToClipboard" class="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600">Copy result to clipboard</button>
      </div>
      <textarea readonly rows="5" cols="40" :value="item.result || 'No result yet'" :disabled="true" class="mt-2 border rounded p-2 w-full"></textarea>
      
    </div>
  `,
    methods: {
        removeItem(){
            window.mitt.emit('remove-item', this.item)
        },
        useHeaders() {
            const { headers } = useToken();
            return headers.value;
        },
        executeCurl(item) {
            this.$emit('execute-curl', item);
        },
        copyResultToClipboard() {
            const textarea = document.createElement('textarea');
            textarea.value = this.item.result;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        },
        copyCurlToClipboard() {
            const method = this.item.method;
            const url = this.item.fullUrl;
            const headers = this.useHeaders(); // Assuming useHeaders is imported in this context
            const params = this.item.query || {};

            const curlCommand = buildCurlCommand(method, url, headers, params);

            const textarea = document.createElement('textarea');
            textarea.value = curlCommand;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        },
    },
};


function buildCurlCommand(method, url, headers, params) {
    const methodUpper = method.toUpperCase();
    let fullUrl = url;

    // For GET requests, append encoded query parameters to the URL
    if (methodUpper === 'GET' && params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            searchParams.append(key, value);
        }
        fullUrl += `?${searchParams.toString()}`;
    }

    // Encode the full URL
    const encodedUrl = encodeURI(fullUrl);

    // Start building the curl command parts
    const cmdParts = [`curl -X ${methodUpper} "${encodedUrl}"`];

    // Add all headers with -H flags
    if (headers) {
        for (const [headerKey, headerValue] of Object.entries(headers)) {
            cmdParts.push(`-H "${headerKey}: ${headerValue}"`);
        }
    }

    // For non-GET requests, add the data flag with parameters
    if (methodUpper !== 'GET' && params && Object.keys(params).length > 0) {
        const data = JSON.stringify(params);
        cmdParts.push(`-d '${data}'`);
    }

    // Join all parts with line continuations
    return cmdParts.join(' \\\n');
}