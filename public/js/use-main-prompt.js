import { ref, watch, computed } from '/lib/vue.esm-browser.dev.js';

export default function useMainPrompt() {
    const mainPrompt = ref('');
    const output = ref('');
    const loading = ref(false);
    const error = ref('');
    const chatHistory = ref([]);
    const threads = ref([]);
    const activeThreadId = ref(null);

    // Computed property to check if we can create a new thread
    const canCreateNewThread = computed(() => {

        console.log("canCreateNewThread",{
            threadsLen: threads.value.length,
            hasSomeUntitledItem: threads.value.some(thread => thread.title === 'Untitled thread')
        })

        // Return true if threads array is empty or no thread has 'Untitled thread' title
        return threads.value.length === 0 || !threads.value.some(thread => thread.title === 'Untitled thread');
    });

    // Load threads from localStorage
    const loadThreads = () => {
        const savedThreads = localStorage.getItem('chat_threads');
        if (savedThreads) {
            threads.value = JSON.parse(savedThreads);
            // If there was an active thread, load it
            const activeThread = localStorage.getItem('active_thread_id');
            if (activeThread) {
                loadThread(activeThread);
            }
        }
    };

    // Save threads to localStorage
    const saveThreads = () => {
        localStorage.setItem('chat_threads', JSON.stringify(threads.value));
        if (activeThreadId.value) {
            localStorage.setItem('active_thread_id', activeThreadId.value);
        }
    };

    // Create new thread
    const createThread = () => {
        if (!canCreateNewThread.value) return;
        
        const threadId = Date.now().toString();
        const newThread = {
            id: threadId,
            title: 'Untitled thread',
            history: [],
            draft: ''
        };
        threads.value.push(newThread);
        saveThreads();
        loadThread(threadId);
    };

    // Load specific thread
    const loadThread = (threadId) => {
        // Clear current chat if switching threads
        if (activeThreadId.value !== threadId) {
            output.value = '';
            chatHistory.value = [];
            mainPrompt.value = '';
        }

        const thread = threads.value.find(t => t.id === threadId);
        if (thread) {
            activeThreadId.value = threadId;
            chatHistory.value = thread.history;
            mainPrompt.value = thread.draft || '';
            saveThreads();
        }
    };

    // Delete thread
    const deleteThread = (threadId) => {
        const index = threads.value.findIndex(t => t.id === threadId);
        if (index !== -1 && window.confirm('Are you sure you want to delete this thread?')) {
            threads.value.splice(index, 1);
            if (activeThreadId.value === threadId) {
                activeThreadId.value = null;
                chatHistory.value = [];
                mainPrompt.value = '';
                output.value = '';
            }
            saveThreads();
        }
    };

    // Rename thread
    const renameThread = (threadId) => {
        const thread = threads.value.find(t => t.id === threadId);
        if (thread) {
            const newTitle = window.prompt('Enter new title:', thread.title);
            if (newTitle) {
                thread.title = newTitle;
                saveThreads();
            }
        }
    };

    // Compute thread title from first message
    const computeThreadTitle = (history) => {
        const firstUserMessage = history.find(msg => msg.role === 'user');
        if (firstUserMessage) {
            const title = firstUserMessage.content.slice(0, 30);
            return title + (title.length >= 30 ? '...' : '');
        }
        return 'Untitled thread';
    };

    // Save draft message
    const saveDraft = () => {
        if (activeThreadId.value) {
            const thread = threads.value.find(t => t.id === activeThreadId.value);
            if (thread) {
                thread.draft = mainPrompt.value;
                saveThreads();
            }
        }
    };

    const executePrompt = async () => {
        if (!mainPrompt.value.trim()) return;
        
        loading.value = true;
        error.value = '';
        const currentPrompt = mainPrompt.value;

        // Create new thread if none active
        if (!activeThreadId.value) {
            createThread();
        }
        
        // Clear input immediately after sending
        mainPrompt.value = '';
        
        // Add user message to history
        chatHistory.value.push({
            role: 'user',
            content: currentPrompt
        });

        try {
            const namespace = window.getCurrentNamespace();
            const response = await fetch(`/api/ns/${namespace}/completion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt: currentPrompt,
                    socket: window.socket.id,
                    history: chatHistory.value 
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Update history with assistant's response
            if (data.history) {
                chatHistory.value = data.history;
            } else if (data.content) {
                chatHistory.value.push({
                    role: 'assistant',
                    content: data.content
                });
            }
            
            // Update thread
            if (activeThreadId.value) {
                const thread = threads.value.find(t => t.id === activeThreadId.value);
                if (thread) {
                    thread.history = chatHistory.value;
                    thread.draft = '';
                    // Update title if it's still the default and we have a message
                    if (thread.title === 'Untitled thread') {
                        thread.title = computeThreadTitle(chatHistory.value);
                    }
                    saveThreads();
                }
            }
            
            output.value = data.content;
        } catch (e) {
            error.value = e.message || 'An error occurred';
            output.value = '';
        } finally {
            loading.value = false;
        }
    };

    // Watch for draft changes
    watch(mainPrompt, () => {
        saveDraft();
    });

    // Initialize
    loadThreads();
    if (!activeThreadId.value && threads.value.length === 0) {
        createThread();
    }

    return {
        mainPrompt,
        output,
        loading,
        error,
        chatHistory,
        threads,
        activeThreadId,
        canCreateNewThread,
        executePrompt,
        createThread,
        loadThread,
        deleteThread,
        renameThread,
    };
}
