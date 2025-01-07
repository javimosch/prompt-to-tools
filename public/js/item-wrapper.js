export default {
    props: ['item'],
    template: `
        <div class="item-wrapper mb-4">
            <div class="flex justify-end mb-2 gap-2">
                <button @click="shareItem" class="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 text-sm">
                    Share
                </button>
                <button @click="duplicateItem" class="bg-purple-500 text-white py-1 px-3 rounded hover:bg-purple-600 text-sm">
                    Duplicate
                </button>
                <button @click="removeItem" class="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 text-sm">
                    Remove
                </button>
            </div>
            <curl-item v-if="item.type === 'curl'"
                 :item="item"
                 @execute-curl="executeCurl">
            </curl-item>
            <table-item v-else-if="item.type === 'table'"
                 :item="item">
            </table-item>
            <graph-item v-else-if="item.type === 'graph'"
                 :item="item">
            </graph-item>
            <sql-item v-else-if="item.type === 'sql'"
                 :item="item">
            </sql-item>
            <chart-item v-else-if="item.type === 'chart'"
                 :item="item">
            </chart-item>
        </div>
    `,
    methods: {
        duplicateItem() {
            // Create a deep copy of the item
            const itemCopy = JSON.parse(JSON.stringify(this.item));
            itemCopy.title = `${itemCopy.title} (Copy)`;
            window.mitt.emit('duplicate-item', itemCopy);
        },
        removeItem() {
            if (confirm('Are you sure you want to remove this item?')) {
                window.mitt.emit('remove-item', this.item);
            }
        },
        shareItem() {
            const itemCopy = JSON.parse(JSON.stringify(this.item));
            navigator.clipboard.writeText(JSON.stringify(itemCopy, null, 2))
                .then(() => {
                    window.showToast({
                        message: 'Tool configuration copied to clipboard!',
                        type: 'success'
                    });
                })
                .catch(err => {
                    window.showToast({
                        message: 'Failed to copy to clipboard',
                        type: 'error'
                    });
                });
        },
        executeCurl(item) {
            this.$emit('execute-curl', item);
        }
    }
};
