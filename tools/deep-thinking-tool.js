const fetch = require('node-fetch');
const { OPENROUTER_API_KEY, LLM_MODEL } = process.env;

module.exports = async function deepThinkingTool(thoughts, nextAction) {
    console.log('Deep thinking about:', { thoughts, nextAction });

    try {
        const prompt = `
            As an AI assistant, analyze the following situation and provide your thoughts:

            Current Situation and Thoughts:
            ${thoughts}

            Planned Next Action:
            ${nextAction}

            Provide a concise analysis of:
            1. The reasoning behind the current situation
            2. Whether the planned next action is appropriate
            3. Any potential issues or improvements to consider

            Format your response in a clear, structured way.
        `;

        const response = await fetch('https://openrouter.ai/api/v1', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are an expert AI assistant focused on analyzing situations and providing strategic insights."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const analysisResponse = data.choices[0].message.content;
        console.log('Deep thinking response:', analysisResponse);

        return { 
            success: true,
            analysis: analysisResponse 
        };
    } catch (error) {
        console.error('Deep thinking error:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
};
