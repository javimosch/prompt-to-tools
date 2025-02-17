const { OpenAI } = require('openai'); // Use the OpenAI library
const axios = require('axios');

// Initialize the OpenAI client for OpenRouter
const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

// Define tools that the LLM can call
const tools = require('./tool-schemas')

const getTools = (names = [])=>{
    if(names.length === 0){
        return tools
    }
    return tools.filter((tool) => {
        return names.includes(tool.function.name)
    })  
}

const getAvailableTools = (stepName) => {
     // Determine available tools based on the step
     let availableTools;
     switch (stepName) {
         case 'initial':
             availableTools = getTools(['query_information']);
             break;
         case 'after_first_deep_think':
             availableTools = getTools(['query_information','deep_thinking_tool','SignalFinalResponse']);
             break;
         case 'after_query_schema':
            availableTools = getTools([]);
             break;
         case 'after_second_deep_think':
             availableTools = getTools()
             break;
         default:
             availableTools = getTools();
             break;
     }
     return availableTools;
}

const computeNextStep = (stepName) => {
    switch (stepName) {
        case 'initial':
            return 'after_first_deep_think';
        case 'after_first_deep_think':
            return 'after_query_schema';
        case 'after_query_schema':
            return 'after_second_deep_think';
        case 'after_second_deep_think':
            return 'after_second_deep_think';
        default:
            return 'initial';
    }
}


// Actual function to query schema info using API calls
async function query_information(query, schema_type, max_tokens = 150, namespace = 'default') {
    try {
        const prompt = `Get information ${schema_type === 'default' ? '(database,openapi,product-documentation or similar)' : schema_type}: ${query}`;

        const response = await axios.post(getApiEndpoint(namespace), {
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
const BASE_API_ENDPOINT = process.env.LLM_RAW_COMPLETION_ENDPOINT || 'http://localhost:3000/api';
const API_TOKEN = process.env.LLM_RAW_COMPLETION_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';

const getApiEndpoint = (namespace = 'default') => {
    return `${BASE_API_ENDPOINT}/ns/${namespace}/completion`;
};

async function recursiveLLMCall(stepName = 'initial', prompt, options = {}, previousMessages = [], depth = 0, maxDepth = 10) {

    let socketId = options.socketId
    const namespace = options.namespace || 'default';

    const logStatus = (prefix ='') => console.log(`${prefix}recursiveLLMCall`, {
        stepName,
        prompt,
        previousMessages: previousMessages.map(message=>{
            return {
                role: message.role,
                content: message.content,
                tool_calls: JSON.stringify((message.tool_calls||[]).map(tool_call=>{
                    return {
                        name: tool_call.function.name,
                        args: tool_call.function.arguments
                    }
                }),null,4)
            }
        }),
        depth,
        maxDepth,
        namespace
    });
    //logStatus()

    const messages = [
        ...previousMessages
    ];

    if(messages.length===0 || messages.length > 0 && messages[messages.length-1].role !== 'user') {
        messages.push({ role: 'user', content: depth === 0 ? prompt : `Continue deep thinking OR if you consider you have a proper answer, call the SignalFinalResponse tool` })
    }


    let tool_choice = 'required'

    //Force final response
    if (depth >= maxDepth) {
        console.log('Maximum recursion depth reached');
        tool_choice = 'none' //Submit final answer
    }

    try {
        const response = await openai.chat.completions.create({
            model: OPENROUTER_MODEL,
            messages: [
                {
                    "role": "system",
                    "content": `You are an intelligent assistant capable of querying various data sources, including MySQL databases, OpenAPI specifications, and application documentation. When a user asks for information, determine the appropriate source type and construct a precise query to retrieve the relevant data.

                    ## Guidelines

                    ### Max iterations

                    - You only have ${depth}/${maxDepth} iterations left

                    ### Deep thinking: 
                    - If you consider you have a proper answer, call the SignalFinalResponse tool. 
                    - Do not call the SignalFinalResponse tool if the an SQL failed to run and you didn't tried to run again
                    - If the user asked to execute/run a SQL query, call the run_sql_tool tool before calling the SignalFinalResponse tool.
                    - Use any available functions or tools, multiple times if needed
                    - If an SQL fail run to, try to reason (with deep_thinking_tool) why the SQL fail run to and how to fix it and call the tool again (up to 3 times)
                    - If the user asked to run an SQL query and it failed to run, try again with different workarounds and do not expect the user to run it manually. Expend the max iterations trying to find a solution
                    - If an tool fail, try to run the deep thinking tool to find the reason and how to fix it
                    - If the user ask for an SQL query first try to reason what are the correct table names to query (user might give a wrong table name or in a different language)
                    - If the user ask to run an SQL query and it fail to run, at least show the SQL query to the user so he can run it manually
                    - If a Generate/Run SQL inital query results in multiple tables possibilities to query, skip SQL tools call and show the options to the user
                    - When the user ask to generate/run an SQL query, always add a LIMIT clause to the SQL query to limit the results to 200 rows, if not LIMIT specified
                    - SQL queries run on DB with might have data > 2023, so there is no problem in querying data > 2023
                    - When generating cURL commands to query endpoints, ensure we use available parameters (endpoint schemas/parameters) to be able to get the expected results
                    - Generating a Chart using cURL/Endpoints is not supported yet but it can be added in the future if requested to "@JAR (maintainer)"
                    - If the initial user query doesn't involve checking database/openapi specs, and you think you can provide an answer right away, go ahead an use the SignalFinalResponse tool.
                    - If the user ask to call a tool again and the tool has already be called, then you can proceed to call the tool again.
                    - If the user ask to call a tool but the tool has not been called yet, first use the deep_thinking_tool to reason next steps.
                    - If the user ask to try/test an sql/curl/request/endpoint, he probably want you to run a generation tool so that he can get the tool in the UI to try/test/view it

                    ### Answers

                    - Always answer in the same language as the question
                    - keep your responses clear and concise
                    - Ensure your explanations are accurate and up-to-date with the latest standards.
                    - If you used a tool like generate_* or run_*, you can mention it in the final answer, given the user would need to open the tools menu to view the new results there.

                    ### Final answer sections:

                    - Global answer section
                    - Deep thinking section: List the thoughts you had during the conversation including why you decided to call the tools and what tools you called
                    - Format the entire answer in html and tailwind css

                    ### Tools:
                    
                    #### deep_thinking_tool: 
                        - Use it if you consider you have a proper answer.
                    
                    #### query_information:
                        - Use this tool to get information about the OpenAPI,database, productdocumentation or any other specifications related to business logic. Do not assume anything.

                    #### run_sql_tool: 
                        - Use it if the user requests to run a SQL query. 
                        - Run generate_sql_tool first. 
                        - Always include database in the SQL query (check [SQL tool context information])
                        - Always limit to 200 results if no specified

                        ---bash code snippet
                        # GOOD
                        select * from db_name.table_name 
                        # BAD
                        select * from table_name
                        ---- 

                    #### generate_sql_tool: 
                        - Use it if the user asks for a SQL query.
                        - Always include database name in the SQL query (check [generate_sql_tool context information] section below)


                    #### generate_curl_tool: 
                        - Use it if the user asks for a cURL command.
                    
                    #### generate_table_tool: 
                        - Use it if the user asks for data in a table format.
                    
                    #### SignalFinalResponse: 
                        - Use it if the LLM wants to submit a final response in HTML format with Tailwind CSS styling.
                        - Do not call this tool if the user asked for RUN/Execute SQL and the run_sql_tool was not called yet
                    
                    
                    Here is some extra context you need to use when working with the tools (do not include this in the response):
                    ${require('../config/llm-context')()}

                    `
                },
                ...messages
            ],
            tools: getAvailableTools(stepName),
            tool_choice: tool_choice,
        });

        /* console.log('response', {
            details: JSON.stringify(response, null, 2)
        }) */

        let updatedMessages = [...messages]

        if(response.error) {
            console.log('LLM RESPONSE ERROR', {
                details: JSON.stringify(response, null, 2),
                messages,
                error:{
                    code: response.error.code,
                    message: response.error.message,
                    stack: response.error.stack
                }
            })

            if(response.error.code === 402) {
                return getFinalResponse(`
                    <div class="flex items-center justify-center">
                        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <span class="block sm:inline">${response.error.message}</span>
                        </div>
                    </div>`
                )   
            }

            //Add error to ctx
            updatedMessages = [
                ...updatedMessages,
                {
                    role: 'user',
                    content: `There was an error in the LLM response, try to provide a final answer including the error details: 
                    
                    Response with error:$
                    ${JSON.stringify(response)}`
                }
            ];

            //Force final response
            return await recursiveLLMCall(computeNextStep(stepName),prompt, options, updatedMessages, maxDepth, maxDepth);
        }

        const responseMessage = response.choices[0].message;


        // If the LLM wants to call a tool
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            
            updatedMessages = [...updatedMessages, responseMessage];
            
            // Handle all tool calls sequentially
            for (const toolCall of responseMessage.tool_calls) {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);

                console.log('Calling tool:', {
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

                if(toolName === 'generate_chart_tool') {
                    toolResponse = await require('../tools/generate-chart-tool')(socketId, toolArgs);
                }

                if(toolName === 'deep_thinking_tool') {
                    toolResponse = await require('../tools/deep-thinking-tool')(JSON.stringify(messages),toolArgs.thoughts, toolArgs.nextAction);

                    global.io.to(socketId).emit('thinking', {
                        thoughts: toolArgs.thoughts,
                        nextAction: toolArgs.nextAction,
                        furtherAnalysis: toolResponse
                    });
                    console.log('Deep thinking tool response:', {
                        thoughts: toolArgs.thoughts,
                        nextAction: toolArgs.nextAction,
                        furtherAnalysis: toolResponse
                    });
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

                if (toolName === 'query_information') {
                    toolResponse = await query_information(toolArgs.query, namespace, toolArgs.max_tokens, namespace);
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

               /*  console.log('Tool response:', {
                    toolName,
                    toolArgs,
                    toolResponse
                }); */

                // Add tool result to message history
                updatedMessages = [
                    ...updatedMessages,
                    {
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(toolResponse)
                    }
                ];
            }

            // Continue the conversation with all tool responses
            return await recursiveLLMCall(computeNextStep(stepName),prompt, options, updatedMessages, depth + 1, maxDepth);
        }

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


        // If finalResponse is empty, set it to the last message from history (assistant)
        if (!finalResponse) {
            try {
                const response = await openai.chat.completions.create({
                    model: OPENROUTER_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: 'You are a helpful assistant. There was no final response during a conversation with an LLM and you need to provide a final response to the user when he ask for it. Reply as if you were the original LLM. The conversation context is the following: ' + JSON.stringify(messages)
                        }
                    ]
                });
                finalResponse = response.choices[0].message;
            } catch (error) {
                console.error('Error during LLM call:', {
                    message: error.message,
                    stack: error.stack
                });
                finalResponse = 'I am unable to provide a final response at this moment. Please try again later.';
            }
        }

        logStatus()

        if(typeof finalResponse !== 'string'||finalResponse==='') {
            console.warn('finalResponse was not a string',{
                finalResponse
            })
            finalResponse = 'I am unable to provide a final response at this moment. Please try again later.';
        }


        // Goal: strip unexpected markdown html snippet wrapper code
        if(finalResponse.includes('```html')) {
            finalResponse = finalResponse.split('```html').join('').split('```').join('');
        }

       

        console.log('FINAL RESPONSE', {
            finalResponse
        })

        // If no tool call is needed, return the result with metadata
        return {
            /* thoughts: {
                messages: messages.map(msg => `<strong>${msg.role}</strong>: ${msg.content}`).join('<br>'),
                depth,
                timestamp: new Date().toISOString(),
            }, */
            history: messages,
            content: finalResponse
        }
    }
}

module.exports = { recursiveLLMCall };