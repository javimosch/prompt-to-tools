const sqlToolAvailable = process.env.RUN_SQL_TOOL_HOST && 
                        process.env.RUN_SQL_TOOL_USERNAME && 
                        process.env.RUN_SQL_TOOL_PASSWORD;

const tools = [
    {
        type: 'function',
        function: {
            name: 'query_information',
            description: 'Get information about various data sources such as databases, OpenAPI specifications, and application documentation.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The query about the data source. Be specific, e.g., what is the name of the table for storing users? or what is the endpoint for user login?'
                    },
                    source_type: {
                        type: 'string',
                        enum: ['mysql', 'openapi', 'documentation'],
                        description: 'Type of source to query about'
                    },
                    max_tokens: {
                        type: 'integer',
                        description: 'Maximum number of tokens in the response',
                        default: 150
                    }
                },
                required: ['query', 'source_type'],
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
            description: 'It sends a SQL query configuration to the client, use this tool each time the user asks for a SQL query, but only if you already called query_information previously',
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
            description: 'It sends a cURL configuration to the client, use this tool each time the user asks for a cURL command, but only if you already called query_information previously. Ensure you supply the base URL, relative URL and method as minimum. Possible parameters: title, baseURL, relativeURL, method, query, payload',
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
                        description: 'Optional query parameters for GET requests',
                    },
                    payload: {
                        type: 'object',
                        description: 'Optional payload/body for non GET requests',
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
                        description: 'Title for the table display. Try to be specific about the data origin (i.g Real-time data from vehicle X and dates between Y and Z)'
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
    {
        type: 'function',
        function: {
            name: 'generate_chart_tool',
            description: 'Generate a chart using Chart.js. Executes a SQL query and displays the results in a chart format. Supports bar and line charts.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'SQL query to get the data. Should return columns for labels and values.'
                    },
                    title: {
                        type: 'string',
                        description: 'Title of the chart'
                    },
                    chartType: {
                        type: 'string',
                        description: 'Type of chart (bar or line)',
                        enum: ['bar', 'line']
                    },
                    labelColumn: {
                        type: 'string',
                        description: 'Column name to use for labels (x-axis). If not provided, first column is used.'
                    },
                    valueColumn: {
                        type: 'string',
                        description: 'Column name to use for values (y-axis). If not provided, second column is used.'
                    },
                    datasetLabel: {
                        type: 'string',
                        description: 'Label for the dataset in the chart legend'
                    }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'deep_thinking_tool',
            description: 'Analyze the current situation and next planned action using a single LLM completion. This tool helps in understanding the reasoning behind decisions and validating next steps.',
            parameters: {
                type: 'object',
                properties: {
                    thoughts: {
                        type: 'string',
                        description: 'Description of what has happened until now, including context and decisions made'
                    },
                    nextAction: {
                        type: 'string',
                        description: 'Description of the next action that will be taken'
                    }
                },
                required: ['thoughts', 'nextAction']
            }
        }
    },
    ...(sqlToolAvailable ? [{
        type: 'function',
        function: {
            name: 'run_sql_tool',
            description: `Execute SQL queries and display results in a table format. The results will be shown directly in the UI without pagination. 
            - Use this tool when the user needs to execute/run a SQL query and it does not ask for a simple SQL query generation
            - Use this tool when the user ask to print some data i.g "Print user named jarancibia (login) and no endpoint is available to accomplish that precise query"
            `,
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