module.exports = function getExtraLLMContext(){
    return `
    
    [cURL tool context information]:
    baseURL ${process.env.CURL_TOOL_BASE_URL}
    Bearer token: BEARER_TOKEN_TO_REPLACE
    Credentials:
        Username: ${process.env.CURL_TOOL_CREDENTIALS_USERNAME}
        Client: ${process.env.CURL_TOOL_CREDENTIALS_CLIENT}
        Password: PASSWORD_TO_REPLACE

    [SQL tool context information]:
        Default SQL database name: ${process.env.RUN_SQL_TOOL_DEFAULT_DATABASE}

    `
}