module.exports = function generateSqlTool(
    title,
    sqlQuery,
    description = '',
    socketId
) {
    console.log("generateSqlTool", {
        title,
        sqlQuery,
        description
    });

    global.io.to(socketId).emit('requestSqlItemComplete', {
        title: title || 'Untitled SQL Query',
        type: 'sql',
        sqlQuery,
        description,
        result: ''
    });

    return "SQL query configuration generated and sent to the client.";
}
