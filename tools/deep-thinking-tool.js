const fetch = require('node-fetch');
const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = process.env;

module.exports = async function deepThinkingTool(context,thoughts, nextAction) {
    //console.log('Deep thinking about:', { thoughts, nextAction });

    try {
        const prompt = `
            Current Situation and Thoughts:
            ${thoughts}

            Planned Next Action:
            ${nextAction}

            Provide a concise analysis of:
            1. Whether the planned next action is appropriate
            2. A potential possible next action if the current one is not appropriate

            Format your response in a clear, structured way
        `;

        const response = await fetch(process.env.OPENROUTER_BASE_URL||'https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:3000',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    {
                        role: "system",
                        content: `As an AI assistant, analyze the following situation (current context, thoughts and planned next action) and provide a consise analysis along with the proposed next action (same as the initial one or a new one) (next action should involve calling one of the tools available in the system, check the Context/History-conversation for the available tools):
            
            Current Context (History conversation):
            ${context}`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 250,
                stream:false
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const rawResponse = await response.text();
        //console.log('Raw response body:', rawResponse);
        //console.log('Raw response body (parsed as JSON):', JSON.parse(rawResponse));
        const data = JSON.parse(rawResponse);
        const analysisResponse = data.choices[0].message.content;
    
        //    console.log('Deep thinking response:', analysisResponse);



        return { 
            success: true,
            analysis: analysisResponse 
        };
    } catch (error) {
        console.error('Deep thinking error:', {
            message: error.message,
            stack: error.stack
        });
        return { 
            success: false, 
            error: error.message 
        };
    }
};
