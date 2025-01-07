import { ref } from '/lib/vue.esm-browser.dev.js';
import useToolItems from './use-tool-items.js';

export default {
    template: `
        <!-- Import Tool Section -->
        <div class="mb-4 p-4 border rounded">
            <h3 class="text-lg font-semibold mb-2">Import Tool</h3>
            <div class="flex gap-2">
                <textarea 
                    ref="importInput"
                    class="flex-grow p-2 border rounded" 
                    placeholder="Paste tool configuration here..."
                    @paste="handleImport"
                    v-model="importText"
                ></textarea>
                <button 
                    @click="handleImport" 
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Import
                </button>
            </div>
            <p v-if="importError" class="text-red-500 mt-2">{{ importError }}</p>
        </div>

        <!-- Tool Items List -->
        <div v-for="item in items" :key="item.relativeURL">
            <item-wrapper :item="item" @execute-curl="executeCurl"></item-wrapper>
        </div>
    `,
    setup() {
        const { items, importError, executeCurl } = useToolItems();
        const importText = ref('');

        const handleImport = () => {
            if (importText.value) {
                window.mitt.emit('import-item', importText.value);
                importText.value = ''; // Clear input after import
            }
        };

        return {
            items,
            importError,
            importText,
            handleImport,
            executeCurl
        };
    }
};
