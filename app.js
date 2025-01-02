require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai'); // Use the OpenAI library
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3005; // Or any other port

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Initialize the OpenAI client for OpenRouter
const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

// Define tools that the LLM can call
const tools = [
    {
        type: 'function',
        function: {
            name: 'get_current_weather',
            description: 'Get the current weather in a given location',
            parameters: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'The city and state, e.g., San Francisco, CA',
                    },
                    unit: {
                        type: 'string',
                        enum: ['celsius', 'fahrenheit'],
                    },
                },
                required: ['location'],
            },
        }
    },
    {
        type: 'function',
        function: {
            name: 'query_schema_info',
            description: 'Get information about database schema or OpenAPI specifications',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The query about schema or API specification',
                    },
                    schema_type: {
                        type: 'string',
                        enum: ['database', 'openapi'],
                        description: 'Type of schema to query about'
                    },
                    max_tokens: {
                        type: 'integer',
                        description: 'Maximum number of tokens in the response',
                        default: 150
                    }
                },
                required: ['query', 'schema_type'],
            },
        }
    },
    {
        type: 'function',
        function: {
            name: 'SignalFinalResponse',
            description: 'Indicate that the LLM wants to submit a final response in HTML format with Tailwind CSS styling',
            parameters: {
                type: 'object',
                properties: {
                    finalResponseAsHTML: {
                        type: 'string',
                        description: 'The final response content to be submitted as HTML with Tailwind CSS styling'
                    }
                },
                required: ['finalResponseAsHTML'],
            },
        }
    }
];

// Mock function to simulate weather data
function get_current_weather(location, unit = 'celsius') {
    const weather = {
        location: location,
        temperature: unit === 'celsius' ? '22°C' : '72°F',
        unit: unit,
        forecast: ['sunny', 'windy'],
    };
    return weather;
}

// Actual function to query schema info using API calls
async function query_schema_info(query, schema_type, max_tokens = 150) {
    try {
        const prompt = `Get information about ${schema_type === 'database' ? 'database schema' : 'OpenAPI specification'}: ${query}`;

        const response = await axios.post(API_ENDPOINT, {
            prompt: prompt,
            max_tokens: max_tokens,
            temperature: 0.3 // Lower temperature for more focused responses
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            }
        });

        return {
            query,
            schema_type,
            result: response.data.choices[0].text.trim()
        };
    } catch (error) {
        console.error('Error querying schema info:', error);
        throw new Error('Failed to query schema information');
    }
}

// Main API endpoint and token (for raw output)
const API_ENDPOINT = process.env.LLM_RAW_COMPLETION_ENDPOINT || 'http://localhost:3000/api/completion';
const API_TOKEN = process.env.LLM_RAW_COMPLETION_API_KEY || ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'

app.get('/', (req, res) => {
    res.render('index', { rawOutput: null, prettyOutput: null, error: null });
});


async function recursiveLLMCall(prompt, previousMessages = [], depth = 0, maxDepth = 6, bestResponse = "") {

    console.log('recursiveLLMCall', {
        prompt,
        previousMessages,
        depth,
        maxDepth,
        bestResponse
    });
    
    const messages = [
        ...previousMessages,
        { role: 'user', content: depth === 0 ? prompt : `Continue deep thinking OR if you consider you have a proper answer, call the SignalFinalResponse tool` }
    ];

    
    if (depth >= maxDepth) {
        console.log('Maximum recursion depth reached');
        /* return {
            content: "Maximum recursion depth reached",
            depth,
            timestamp: new Date().toISOString()
        }; */
        return await getFinalResponse(bestResponse);
    }

   
    try {
        const response = await openai.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    "role": "system",
                    "content": `You are an expert in OpenAPI specifications and database schemas. When users ask about OpenAPI specs, provide detailed explanations of endpoints, methods, parameters, and responses. For database schema questions, describe table structures, relationships, data types, and common SQL operations. Always answer in the same language as the question, keep your responses clear and concise, utilize any available functions or tools, and format your answers in html. Ensure your explanations are accurate and up-to-date with the latest standards.`
                  },
                ...messages
            ],
            tools: tools,
            tool_choice: 'required',
        });

        console.log('response', {
            details: JSON.stringify(response, null, 2)
        })

        const responseMessage = response.choices[0].message;



        // If the LLM wants to call a tool
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolCall = responseMessage.tool_calls[0]; // Handle first tool call
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            let toolResponse;

            if (toolName === 'SignalFinalResponse') {
                return await getFinalResponse(toolArgs.finalResponseAsHTML);
            }

            if (toolName === 'get_current_weather') {
                toolResponse = get_current_weather(toolArgs.location, toolArgs.unit);
            } else if (toolName === 'query_schema_info') {
                toolResponse = await query_schema_info(toolArgs.query, toolArgs.schema_type, toolArgs.max_tokens);
            } else {
                throw new Error(`Tool ${toolName} not found`);
            }

            console.log('Calling tool:', {
                toolName,
                toolArgs,
                toolResponse
            });

            // Add tool result to message history
            const updatedMessages = [
                ...messages,
                responseMessage,
                {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    //name: toolName,
                    content: JSON.stringify(toolResponse)
                }
            ];

            // Recursive call with updated context
            return await recursiveLLMCall(prompt, updatedMessages, depth + 1, maxDepth, bestResponse);
        }

        bestResponse = responseMessage.content;

        return await getFinalResponse(responseMessage.content);
    } catch (error) {
        console.error('Error during recursiveLLMCall:', error);
        return {
            content: 'Error during completion',
            depth,
            timestamp: new Date().toISOString(),
            messageHistory: messages
        };
    }

    async function getFinalResponse(finalResponse) {

      
        // If finalResponse is empty, set it to the last message from history and pop it from the array
        if (!finalResponse) {
            finalResponse = bestResponse
        }

      /*   const response = await openai.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    role: 'system', content: `You are a markdown expect`
                },
                { role: 'user', content: `Convert the following to markdown: ${finalResponse}` }
            ],
        });

        finalResponse = response.choices[0].message.content
 */
        console.log('FINAL RESPONSE',{
            finalResponse
        })

        // If no tool call is needed, return the result with metadata
        return {
            thoughts: {
                messages: messages.map(msg => `<strong>${msg.role}</strong>: ${msg.content}`).join('<br>'),
                depth,
                timestamp: new Date().toISOString(),
            },
            content: finalResponse
        }
    }
}

app.post('/pretty-output', async (req, res) => {
    let { prompt } = req.body;

    try {
        console.log('Received prompt:', prompt);

        const result = await recursiveLLMCall(prompt);

        console.log('Result from recursiveLLMCall:', result);

        res.render('index', {
            prettyOutput: result.content,
            /* rawOutput: JSON.stringify({
                depth: result.depth,
                timestamp: result.timestamp,
                thoughts: result.thoughts
            }, null, 2), */
            rawOutput:'',
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.render('index', {
            error: 'Failed to process the request',
            prettyOutput: null,
            rawOutput: null
        });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
