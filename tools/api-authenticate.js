const axios = require('axios');

module.exports = async function apiAuthenticateService(baseUrl, authEndpointRelative, method, query, payload) {
    const url = `${baseUrl}${authEndpointRelative}`;
    console.log('apiAuthenticateService', {
        baseUrl,
        authEndpointRelative,
        method,
        query,
        payload
    });

    try {
        const response = await axios({
            url,
            method,
            params: query,
            data: payload,
        });
        return {
            apiResponse: response.data
        };
    } catch (error) {
        console.error('Authentication error:', error);
        
        return {
            apiResponse: "Empty",
            error:{
                message: error.message,
                stack: error.stack
            }
        };
    }
}