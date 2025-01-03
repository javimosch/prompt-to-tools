export default {
    props: ['item'],
    template: `
        <div class="item-wrapper mb-4">
            <div class="flex justify-end mb-2 gap-2">
                <button @click="duplicateItem" class="bg-purple-500 text-white py-1 px-3 rounded hover:bg-purple-600 text-sm">
                    Duplicate
                </button>
            </div>
            <component 
                :is="item.type === 'curl' ? 'curl-item' : 
                     item.type === 'sql' ? 'sql-item' :
                     item.type === 'graph' ? 'graph-item' : 'table-item'" 
                :item="item" 
                @execute-curl="executeCurl">
            </component>
        </div>
    `,
    methods: {
        duplicateItem() {
            // Create a deep copy of the item
            const itemCopy = JSON.parse(JSON.stringify(this.item));
            itemCopy.title = `${itemCopy.title} (Copy)`;
            window.mitt.emit('duplicate-item', itemCopy);
        },
        executeCurl(item) {
            this.$emit('execute-curl', item);
        }
    }
};
