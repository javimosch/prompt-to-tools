export default {
    props: ['item'],
    data() {
        return {
            loading: false,
            error: null,
            chart: null
        }
    },
    template: `
        <div class="chart-item p-4 border rounded">
            <div class="flex justify-between items-center mb-4">
                <span class="font-bold text-blue-600">{{item.title}}</span>
                <button @click="removeItem" class="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600">Remove</button>
            </div>
            
            <div v-if="error" class="mt-2 p-2 bg-red-100 text-red-700 rounded">
                {{ error }}
            </div>

            <div class="relative w-full" style="height: 400px;">
                <canvas ref="chartCanvas"></canvas>
            </div>
        </div>
    `,
    mounted() {
        this.renderChart();
    },
    methods: {
        removeItem() {
            window.mitt.emit('remove-item', this.item);
        },
        destroyChart() {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        },
        async renderChart() {
            try {
                this.loading = true;
                this.error = null;
                
                // Destroy existing chart if any
                this.destroyChart();

                const canvas = this.$refs.chartCanvas;
                const ctx = canvas.getContext('2d');

                // Create new chart
                this.chart = new Chart(ctx, {
                    type: this.item.chartOptions.type,
                    data: this.item.chartOptions.data,
                    options: this.item.chartOptions.options
                });

                this.loading = false;
            } catch (err) {
                console.error('Error rendering chart:', err);
                this.error = 'Error rendering chart: ' + err.message;
                this.loading = false;
            }
        }
    },
    beforeUnmount() {
        this.destroyChart();
    },
    watch: {
        'item.data': {
            handler() {
                this.renderChart();
            },
            deep: true
        }
    }
};