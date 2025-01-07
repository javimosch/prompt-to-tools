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
            <div class="flex justify-between items-center">
                <span class="font-bold text-blue-600">{{item.title}}</span>
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

                // Wait for the next DOM update cycle
                await this.$nextTick();
                
                const canvas = this.$refs.chartCanvas;
                if (!canvas) {
                    throw new Error('Canvas element not found');
                }

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error('Could not get canvas context');
                }

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
