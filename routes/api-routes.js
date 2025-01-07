const { recursiveLLMCall } = require('../services/llm-service');

global.app.post('/api/completion', async (req, res) => {
    let { prompt,socket, history } = req.body;

    try {
        console.log('API /api/completion received prompt:', prompt);
        const result = await recursiveLLMCall("initial",prompt,{socketId:socket},history||[]);
        res.json({ content: result.content });
    } catch (error) {
        console.error('API /api/completion error:', error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});
