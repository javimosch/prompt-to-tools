module.exports = function generateCurlTool(
    title,
    baseURL,
    relativeURL,
    method,
    query = {},
    payload = {},
    socketId
) {
    console.log("generateCurlTool", {
        title,
        baseURL,
        relativeURL,
        method,
        query,
        payload})

    global.io.to(socketId).emit('requestCurlItemComplete', {
        title:title||'Untitled',
        type:'curl',
        baseURL,
        relativeURL,
        method,
        query,
        payload,
        result:''
    })

   return "cURL tool configuration generated and sent to the client."
}