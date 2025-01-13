// Handle namespace selection
let currentNamespace = localStorage.getItem('selectedNamespace') || 'default';

document.addEventListener('DOMContentLoaded', () => {
    const namespaceSelector = document.getElementById('namespaceSelector');
    if (namespaceSelector) {
        // Set initial value from localStorage
        namespaceSelector.value = currentNamespace;

        // Handle namespace changes
        namespaceSelector.addEventListener('change', (e) => {
            currentNamespace = e.target.value;
            localStorage.setItem('selectedNamespace', currentNamespace);
            // Emit event for other components that might need to know about namespace changes
            window.dispatchEvent(new CustomEvent('namespaceChanged', { detail: currentNamespace }));
        });
    }
});

// Export getCurrentNamespace function for other modules to use
window.getCurrentNamespace = () => currentNamespace;
