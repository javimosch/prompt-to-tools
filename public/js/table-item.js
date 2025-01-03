import useToken from "./use-token.js";

export default {
    props: ['item'],
    data() {
        return {
            loading: false,
            error: null,
            tableData: this.item.data || null,
            itemsPerPage: 20,
            displayLimit: 20,
            isHalJson: false,
            showConfig: false,
            configEdit: '',
            configError: null,
            searchQuery: '',
            staticMode: !!this.item.data
        }
    },
    template: `
      <div class="table-item p-4 border rounded">
        <div class="flex justify-between items-center">
            <span class="font-bold text-blue-600">{{item.title}}</span>
            <button @click="removeItem" class="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600">Remove</button>
        </div>
        <h4 class="text-md font-medium" v-if="!item.data">{{ item.method }} {{ item.fullUrl }}</h4>
        
        <div class="flex gap-2 mt-2">
            <button v-if="!item.data" @click="fetchData" class="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600" :disabled="loading">
                {{ loading ? 'Loading...' : 'Fetch Data' }}
            </button>
            <button v-if="item.data" @click="renderData" class="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600" :disabled="loading">
                {{ loading ? 'Loading...' : 'Render Data' }}
            </button>
            <button 
                @click="toggleConfig" 
                class="bg-gray-500 text-white py-1 px-4 rounded hover:bg-gray-600"
                :class="{ 'bg-gray-700': showConfig }">
                Edit Configuration
            </button>
        </div>

        <!-- Search Input for Static Data -->
        <div v-if="staticMode && tableData" class="mt-4">
            <div class="relative">
                <input 
                    v-model="searchQuery"
                    type="text"
                    placeholder="Search all columns..."
                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span v-if="searchQuery" 
                      @click="searchQuery = ''"
                      class="absolute right-3 top-2.5 cursor-pointer text-gray-500 hover:text-gray-700">
                    ✕
                </span>
            </div>
            <div class="text-sm text-gray-600 mt-1">
                Showing {{ filteredData.length }} of {{ tableData.length }} items
            </div>
        </div>

        <!-- Configuration Editor -->
        <div v-if="showConfig" class="mt-4 p-4 bg-gray-50 rounded border">
            <div class="mb-2 flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">Edit Configuration</span>
                <div class="flex gap-2">
                    <button @click="resetConfig" class="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                        Reset
                    </button>
                    <button @click="saveConfig" class="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                        Save
                    </button>
                </div>
            </div>
            <div v-if="configError" class="mb-2 text-sm text-red-600">{{ configError }}</div>
            <textarea 
                v-model="configEdit"
                class="w-full h-48 font-mono text-sm p-2 border rounded"
                :class="{ 'border-red-500': configError }"
            ></textarea>
        </div>

        <div v-if="error" class="mt-2 p-2 bg-red-100 text-red-700 rounded">
            {{ error }}
        </div>

        <div v-if="tableData" class="mt-4">
            <div class="overflow-x-auto">
                <table class="min-w-full table-auto border-collapse">
                    <thead>
                        <tr>
                            <th v-for="header in tableHeaders" 
                                :key="header"
                                class="border-b-2 border-gray-300 bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-600">
                                {{ header }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in paginatedData" 
                            :key="index"
                            class="hover:bg-gray-50">
                            <td v-for="header in tableHeaders" 
                                :key="header"
                                class="border-b border-gray-200 px-4 py-2 text-sm">
                                {{ formatCell(row[header]) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Load More Button -->
            <div v-if="hasMoreItems" class="mt-4 flex justify-center">
                <button 
                    @click="loadMore" 
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                    :disabled="loading">
                    <span v-if="loading" class="inline-block animate-spin">↻</span>
                    <span>{{ loading ? 'Loading...' : 'Load More' }}</span>
                    <span class="text-sm text-blue-200">({{ displayLimit }} of {{ filteredData.length }})</span>
                </button>
            </div>
        </div>
      </div>
    `,
    computed: {
        tableHeaders() {
            if (!this.tableData || !Array.isArray(this.displayData) || this.displayData.length === 0) return [];
            return Object.keys(this.displayData[0]);
        },
        displayData() {
            if (!this.tableData) return [];
            if (!this.staticMode) {
                return Array.isArray(this.tableData) ? this.tableData : 
                       (this.tableData._embedded?.item || []);
            }
            return this.filteredData;
        },
        filteredData() {
            if (!this.staticMode || !this.tableData) return [];
            if (!this.searchQuery) return this.tableData;

            const query = this.searchQuery.toLowerCase();
            return this.tableData.filter(row => {
                return Object.values(row).some(value => {
                    const strValue = this.formatCell(value).toLowerCase();
                    return strValue.includes(query);
                });
            });
        },
        paginatedData() {
            return this.displayData.slice(0, this.displayLimit);
        },
        hasMoreItems() {
            return this.displayLimit < this.filteredData.length;
        }
    },
    watch: {
        item: {
            immediate: true,
            handler(newVal) {
                this.configEdit = JSON.stringify(newVal, null, 4);
                if (newVal.data) {
                    this.tableData = newVal.data;
                    this.staticMode = true;
                    this.displayLimit = this.itemsPerPage;
                }
            }
        },
        searchQuery() {
            // Reset display limit when searching
            this.displayLimit = this.itemsPerPage;
        }
    },
    methods: {
        removeItem() {
            window.mitt.emit('remove-item', this.item);
        },
        toggleConfig() {
            this.showConfig = !this.showConfig;
            if (this.showConfig) {
                this.configEdit = JSON.stringify(this.item, null, 4);
                this.configError = null;
            }
        },
        resetConfig() {
            this.configEdit = JSON.stringify(this.item, null, 4);
            this.configError = null;
        },
        saveConfig() {
            try {
                const newConfig = JSON.parse(this.configEdit);
                
                // Validate required fields
                if (!newConfig.title || !newConfig.method || !newConfig.baseURL || !newConfig.relativeURL) {
                    throw new Error('Required fields missing: title, method, baseURL, and relativeURL are required');
                }

                // Validate method
                const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
                if (!validMethods.includes(newConfig.method)) {
                    throw new Error('Invalid method. Must be one of: ' + validMethods.join(', '));
                }

                // Update the item
                Object.assign(this.item, newConfig);
                this.configError = null;
                this.showConfig = false;

                // Reset table state
                this.displayLimit = this.itemsPerPage;
                this.tableData = null;
                this.error = null;
            } catch (err) {
                this.configError = err.message;
                console.error('Configuration error:', err);
            }
        },
        async fetchData() {
            this.loading = true;
            this.error = null;
            
            try {
                const url = new URL(this.item.baseURL + this.item.relativeURL);
                
                // Add pagination parameters if HAL+JSON mode
                if (this.isHalJson) {
                    url.searchParams.set('page', 1);
                    url.searchParams.set('itemsPerPage', this.itemsPerPage);
                }
                
                // Add other query parameters
                Object.entries(this.item.query || {}).forEach(([key, value]) => {
                    if (!['page'].includes(key)) {
                        url.searchParams.append(key, value);
                    }
                });

                const { headers } = useToken();
                
                const response = await fetch(url, {
                    method: this.item.method,
                    headers: {
                        ...headers.value,
                        'Accept': 'application/hal+json,application/json'
                    },
                    ...(this.item.method !== 'GET' && {
                        body: JSON.stringify(this.item.payload)
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                this.isHalJson = contentType && contentType.includes('hal+json');

                const data = await response.json();
                this.tableData = data;
                
                if (this.isHalJson) {
                    this.totalItems = data.totalItems || 0;
                    this.itemsPerPage = this.item.query.itemsPerPage || data.itemsPerPage || 10;
                }

                this.item.result = JSON.stringify(data, null, 2);
            } catch (err) {
                this.error = err.message;
                console.error('Error fetching data:', err);
            } finally {
                this.loading = false;
            }
        },
        renderData() {
            this.loading = true;
            try {
                // Re-render the data by temporarily clearing and resetting it
                const tempData = this.item.data;
                this.tableData = null;
                // Use nextTick to ensure the table is re-rendered
                this.$nextTick(() => {
                    this.tableData = tempData;
                    this.loading = false;
                });
            } catch (err) {
                this.error = 'Error rendering data: ' + err.message;
                this.loading = false;
            }
        },
        loadMore() {
            this.loading = true;
            // Simulate loading delay for better UX
            setTimeout(() => {
                this.displayLimit += this.itemsPerPage;
                this.loading = false;
            }, 300);
        },
        formatHeader(header) {
            return header
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
        },
        formatCell(value) {
            if (value === null || value === undefined) return '-';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
        }
    }
};