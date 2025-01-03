module.exports = function generateTableTool(
    title,
    baseURL,
    relativeURL,
    method,
    query = {},
    payload = {},
    responseSchema = {},
    socketId
) {
    console.log("generateTableTool", {
        title,
        baseURL,
        relativeURL,
        method,
        query,
        payload,
        responseSchema
    });

    global.io.to(socketId).emit('requestTableItemComplete', {
        title: title || 'Untitled Table',
        type: 'table',
        baseURL,
        relativeURL,
        method,
        query,
        payload,
        responseSchema,
        result: ''
    });

    return "Table configuration generated and sent to the client.";
}
