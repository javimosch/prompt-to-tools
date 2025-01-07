export default {
    props: ['item'],
    template: `
    <div class="sql-item p-4 border rounded">
        <span class="font-bold text-blue-600">{{item.title}}</span>
        
        <p class="text-gray-600 mt-2">{{item.description}}</p>
        
        <div class="bg-gray-100 p-2 rounded mt-2 font-mono whitespace-pre-wrap break-words">
            {{item.sqlQuery}}
        </div>
        
        <div class="flex gap-2 mt-2">
            <button @click="copySqlToClipboard" class="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600">
                Copy SQL
            </button>
        </div>
    </div>
    `,
    methods: {
        copySqlToClipboard() {
            navigator.clipboard.writeText(this.item.sqlQuery)
                .then(() => {
                    // Could add a toast notification here if desired
                    console.log('SQL copied to clipboard');
                })
                .catch(err => console.error('Failed to copy:', err));
        }
    }
};
