const { OpenAI } = require('openai'); // Use the OpenAI library
const axios = require('axios');

// Initialize the OpenAI client for OpenRouter
const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

// Define tools that the LLM can call
const tools = require('./tool-schemas')


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



async function recursiveLLMCall(prompt, options = {}, previousMessages = [], depth = 0, maxDepth = 10, bestResponse = "") {

    let socketId = options.socketId

    console.log('recursiveLLMCall', {
        prompt,
        socketId,
        previousMessages: JSON.stringify(previousMessages,null,4),
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
                    "content": `You are an expert in OpenAPI specifications and database schemas. When users ask about OpenAPI specs, provide detailed explanations of endpoints, methods, parameters, and responses. For database schema questions, describe table structures, relationships, data types, and common SQL operations. Always answer in the same language as the question, keep your responses clear and concise, utilize any available functions or tools, and format your answers in html. Ensure your explanations are accurate and up-to-date with the latest standards.

                    ## Guidelines

                    ### Deep thinking: 
                    If you consider you have a proper answer, call the SignalFinalResponse tool. 
                    If the user asked to execute/run a SQL query, call the run_sql_tool tool before calling the SignalFinalResponse tool.

                    ### Tools:
                    
                    
                    #### run_sql_tool: 
                        - Use it if the user requests to run a SQL query. 
                        - Run generate_sql_tool first. 
                        - Always include database in the SQL query (check [SQL tool context information])
                        - Always limit to 200 results if no specified

                    #### generate_sql_tool: 
                        - Use it if the user asks for a SQL query.
                        - Always include database in the SQL query (check [SQL tool context information])


                    #### generate_curl_tool: 
                        - Use it if the user asks for a cURL command.
                    
                    #### generate_table_tool: 
                        - Use it if the user asks for data in a table format.
                    
                    #### SignalFinalResponse: 
                        - Use it if the LLM wants to submit a final response in HTML format with Tailwind CSS styling.
                    
                    
                    Here is some extra context information when you need it (using tools) (do not include this in the response):
                    ${require('../config/llm-context')()}

                    `
                },
                ...messages
            ],
            tools: tools,
            tool_choice: 'required',
        });

        console.log('response', {
            details: JSON.stringify(response, null, 2)
        })

        if(response.error) {
            console.log('response error', {
                details: JSON.stringify(response, null, 2),
                messages
            })
            return getFinalResponse(bestResponse)
        }

        const responseMessage = response.choices[0].message;



        // If the LLM wants to call a tool
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            const toolCall = responseMessage.tool_calls[0]; // Handle first tool call
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            console.log('Calling tool 1:', {
                toolName,
                toolArgs
            });

            let toolResponse = "No tool found";

            if (toolName === 'SignalFinalResponse') {
                return await getFinalResponse(toolArgs.finalResponseAsHTML);
            }

            if(toolName === 'run_sql_tool') {
                toolResponse = await require('../tools/run-sql-tool')(socketId, toolArgs);
            }


            if (toolName === 'api_authenticate') {
                toolResponse = await require('../tools/api-authenticate')(
                    toolArgs.baseURL,
                    toolArgs.authEndpointRelative, toolArgs.method, toolArgs.query, toolArgs.payload)
            }

            if (toolName === 'generate_curl_tool') {
                toolResponse = await require('../tools/generate-curl-tool')(
                    toolArgs.title,
                    toolArgs.baseURL,
                    toolArgs.relativeURL, 
                    toolArgs.method, 
                    toolArgs.query, 
                    toolArgs.payload, 
                    socketId
                )
            }

            
            if (toolName === 'query_schema_info') {
                toolResponse = await query_schema_info(toolArgs.query, toolArgs.schema_type, toolArgs.max_tokens);
            } 

            if (toolName === 'generate_sql_tool') {
                toolResponse = await require('../tools/generate-sql-tool')(
                    toolArgs.title,
                    toolArgs.sqlQuery,
                    toolArgs.description,
                    socketId
                )
            }

            if (toolName === 'generate_table_tool') {
                toolResponse = await require('../tools/generate-table-tool')(
                    toolArgs.title,
                    toolArgs.baseURL,
                    toolArgs.relativeURL,
                    toolArgs.method,
                    toolArgs.query,
                    toolArgs.payload,
                    toolArgs.responseSchema,
                    socketId
                )
            }

            console.log('Calling tool 2:', {
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
            return await recursiveLLMCall(prompt, options, updatedMessages, depth + 1, maxDepth, bestResponse);
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
        console.log('FINAL RESPONSE', {
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

module.exports = { recursiveLLMCall };