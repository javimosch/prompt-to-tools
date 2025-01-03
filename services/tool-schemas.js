const sqlToolAvailable = process.env.RUN_SQL_TOOL_HOST && 
                        process.env.RUN_SQL_TOOL_USERNAME && 
                        process.env.RUN_SQL_TOOL_PASSWORD;

const tools = [
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
    },
    {
        type: 'function',
        function: {
            name: 'generate_sql_tool',
            description: 'It sends a SQL query configuration to the client, use this tool each time the user asks for a SQL query, but only if you already called query_schema_info previously',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'Title for the SQL query'
                    },
                    sqlQuery: {
                        type: 'string',
                        description: 'The SQL query to be executed'
                    },
                    description: {
                        type: 'string',
                        description: 'Optional description of what the SQL query does'
                    }
                },
                required: ['title', 'sqlQuery']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_curl_tool',
            description: 'It sends a cURL configuration to the client, use this tool each time the user asks for a cURL command, but only if you already called query_schema_info previously',
            parameters: {
                type: 'object',
                properties: {
                    title:{
                        type: 'string',
                        description: 'The title of the cURL command (A description of what it does)',
                    },
                    baseURL: {
                        type: 'string',
                        description: 'The base URL for the cURL request',
                    },
                    relativeURL: {
                        type: 'string',
                        description: 'The relative URL for the cURL request',
                    },
                    method: {
                        type: 'string',
                        enum: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
                        description: 'HTTP method for the cURL request',
                    },
                    query: {
                        type: 'object',
                        description: 'Optional query parameters for the cURL request',
                    },
                    payload: {
                        type: 'object',
                        description: 'Optional payload for non GET requests',
                    }
                },
                required: ['relativeURL', 'method'],
            },
        }
    },
    {
        type: 'function',
        function: {
            name: 'generate_table_tool',
            description: 'It sends a table configuration to the client for fetching and displaying data in a table format. Use this tool when the response data needs to be displayed in a table.',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'Title for the table display'
                    },
                    baseURL: {
                        type: 'string',
                        description: 'Base URL for the API endpoint'
                    },
                    relativeURL: {
                        type: 'string',
                        description: 'Relative URL path for the API endpoint'
                    },
                    method: {
                        type: 'string',
                        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                        description: 'HTTP method for the request'
                    },
                    query: {
                        type: 'object',
                        description: 'Query parameters for the request'
                    },
                    payload: {
                        type: 'object',
                        description: 'Request body payload'
                    },
                    responseSchema: {
                        type: 'object',
                        description: 'Schema describing the expected response structure'
                    }
                },
                required: ['title', 'baseURL', 'relativeURL', 'method']
            }
        }
    },
    ...(sqlToolAvailable ? [{
        type: 'function',
        function: {
            name: 'run_sql_tool',
            description: 'Execute SQL queries and display results in a table format. The results will be shown directly in the UI without pagination. Use this tool when the user needs to execute/run a SQL query and it does not ask for a simple SQL query generation',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The SQL query to execute'
                    },
                    title: {
                        type: 'string',
                        description: 'Optional title for the results table'
                    }
                },
                required: ['query']
            }
        }
    }] : [])
];

console.log("Available tools",{
    tools:tools.map((tool) => {
        return tool.function.name
    })
});

module.exports = tools