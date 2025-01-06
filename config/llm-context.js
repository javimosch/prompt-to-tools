module.exports = function getExtraLLMContext(){
    return `
    
    [generate_curl_tool context information]
    baseURL ${process.env.CURL_TOOL_BASE_URL}
    Bearer token: BEARER_TOKEN_TO_REPLACE
    Credentials:
        Username: ${process.env.CURL_TOOL_CREDENTIALS_USERNAME}
        Client: ${process.env.CURL_TOOL_CREDENTIALS_CLIENT}
        Password: PASSWORD_TO_REPLACE

    [generate_sql_tool context information]
        Default SQL database name: ${process.env.RUN_SQL_TOOL_DEFAULT_DATABASE}

    `
}