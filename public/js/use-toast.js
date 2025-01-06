import { ref, provide, inject } from '/lib/vue.esm-browser.prod.js';

export function useToast() {
    const toasts = ref([]);
    const TOAST_DURATION = 1000*60*2; // 2 minutes to automatically dismiss

    function showToast(message) {
        const toast = {
            id: Date.now(),
            message,
            visible: true
        };
        
        toasts.value.push(toast);

        console.log('Toast added:', toast);
        
        setTimeout(() => {
            dismissToast(toast.id);
        }, TOAST_DURATION);
    }

    function dismissToast(id) {
        const index = toasts.value.findIndex(t => t.id === id);
        if (index !== -1) {
            toasts.value.splice(index, 1);
            console.log('Toast dismissed:', id);
        }
    }

    provide('showToast', showToast);
    provide('dismissToast', dismissToast); // Expose dismissToast
    provide('toasts', toasts);
    window.showToast = showToast;
    
    return {
        toasts,
        showToast,
        dismissToast // Return dismissToast
    };
}

// Toast component
export const ToastContainer = {
    template: `
        <div class="fixed bottom-4 right-4 z-50 space-y-2">
            <div v-for="toast in toasts" :key="toast.id" @click="dismissToast(toast.id)">
    <div class="bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md">
        <div v-if="typeof toast.message === 'string'" class="mb-2">
            <div class="font-semibold text-purple-300">Message:</div>
            <div class="text-sm break-words">{{ toast.message }}</div>
        </div>
        <div v-else-if="typeof toast.message === 'object'">
            <div v-if="toast.message.thoughts" class="mb-2">
                <div class="font-semibold text-blue-300">Thoughts:</div>
                <div class="text-sm break-words">{{ toast.message.thoughts }}</div>
            </div>
            <div v-if="toast.message.nextAction" class="mb-2">
                <div class="font-semibold text-green-300">Next Action:</div>
                <div class="text-sm break-words">{{ toast.message.nextAction }}</div>
            </div>
            <div v-if="toast.message.furtherAnalysis" class="mb-2">
                <div class="font-semibold text-yellow-300">Further Analysis:</div>
                <div class="text-sm break-words">{{ toast.message.furtherAnalysis }}</div>
            </div>
            <div v-if="!toast.message.thoughts && !toast.message.nextAction && !toast.message.furtherAnalysis" class="mb-2">
                <div class="font-semibold text-red-300">Additional Data:</div>
                <pre class="text-sm break-words">{{ JSON.stringify(toast.message, null, 2) }}</pre>
            </div>
        </div>
    </div>
</template>
        </div>
    `,
    setup() {
        const toasts = inject('toasts');
        const dismissToast = inject('dismissToast');
        return {
            toasts,
            dismissToast
        }
    }
};
