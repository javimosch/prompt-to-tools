export default {
    props: ['item'],
    template: `
        <div class="item-wrapper mb-4">
            <div class="flex justify-end mb-2 gap-2">
                <button @click="duplicateItem" class="bg-purple-500 text-white py-1 px-3 rounded hover:bg-purple-600 text-sm">
                    Duplicate
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
        executeCurl(item) {
            this.$emit('execute-curl', item);
        }
    }
};
