const { recursiveLLMCall } = require('../services/llm-service');

global.app.post('/api/ns/:ns/completion', async (req, res) => {
    let { prompt, socket, history } = req.body;
    const namespace = req.params.ns;

    try {
        console.log('API /api/completion received prompt:', prompt, 'namespace:', namespace);
        const result = await recursiveLLMCall("initial", prompt, { socketId: socket, namespace }, history || []);
        res.json({ content: result.content });
    } catch (error) {
        console.error('API /api/completion error:', error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});

// Keep the old endpoint for backward compatibility, defaulting to 'default' namespace
global.app.post('/api/completion', async (req, res) => {
    let { prompt, socket, history } = req.body;

    try {
        console.log('API /api/completion (legacy) received prompt:', prompt);
        const result = await recursiveLLMCall("initial", prompt, { socketId: socket, namespace: 'default' }, history || []);
        res.json({ content: result.content });
    } catch (error) {
        console.error('API /api/completion error:', error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});
