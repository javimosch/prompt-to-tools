const { recursiveLLMCall } = require('./http-routes');

global.app.post('/api/completion', async (req, res) => {
    let { prompt } = req.body;

    try {
        console.log('API /api/completion received prompt:', prompt);
        const result = await recursiveLLMCall(prompt);
        res.json({ content: result.content });
    } catch (error) {
        console.error('API /api/completion error:', error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});
