import { ref } from '/lib/vue.esm-browser.prod.js';
export default function useMainPrompt() {
    const mainPrompt = ref('');
    const output = ref('');
    const loading = ref(false);
    const error = ref('');

    const executePrompt = async () => {
        loading.value = true;
        error.value = '';
        try {
            const response = await fetch('/api/completion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: mainPrompt.value,socket:window.socket.id }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            output.value = data.content;
        } catch (e) {
            error.value = e.message || 'An error occurred';
            output.value = '';
        } finally {
            loading.value = false;
        }
    };

    return {
        mainPrompt,
        output,
        loading,
        error,
        executePrompt,
    };
}
