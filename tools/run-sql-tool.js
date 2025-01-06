const mysql = require('mysql2/promise');

const { RUN_SQL_TOOL_HOST, RUN_SQL_TOOL_USERNAME, RUN_SQL_TOOL_PASSWORD } = process.env;

module.exports = async function runSqlTool(socketId, data) {
    console.log('Running SQL tool with query:', data.query);

    if (!data.query) {
        console.error('No SQL query provided');
        return { error: 'SQL execution fail: No SQL query provided' };
    }

    try {
        // Create the connection
        const connection = await mysql.createConnection({
            host: RUN_SQL_TOOL_HOST,
            user: RUN_SQL_TOOL_USERNAME,
            password: RUN_SQL_TOOL_PASSWORD,
            ssl: {
                rejectUnauthorized: false
            },
            connectTimeout: 10000, // 10 seconds connection timeout
            timeout: 10000 // 10 seconds for operations
        });

        console.log('Connected to database successfully');

        // Execute the query with timeout
        try {
            const [rows] = await connection.execute({
                sql: data.query,
                timeout: 10000 // 10 seconds query timeout
            });
            console.log('Query executed successfully, rows:', rows.length);

            // Prepare table configuration
            const tableConfig = {
                id: Math.random().toString(36).substring(2, 6),
                type: 'table',
                title: data.title || 'SQL Query Results',
                data: [],
                query: {
                    sql: data.query
                }
            };

            console.log('SQL results:', {
                tableConfig
            });

            // Split data in chunks of 5 items and send "requestTableItemPartial" sequentially
            const chunkSize = 10;
            const chunks = Array.from({ length: Math.ceil(rows.length / chunkSize) }, (v, k) => rows.slice(k * chunkSize, (k + 1) * chunkSize));

            console.log('Sending', chunks.length, 'chunks');

            for (let i = 0; i < chunks.length; i++) {
                console.log(`Sending chunk ${i + 1}/${chunks.length}`);
                global.io.to(socketId).emit('requestTableItemPartial', {
                    id: tableConfig.id,
                    data: chunks[i]
                });
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Send "requestTableItemComplete" at the end
            console.log('Sending requestTableItemComplete');
            global.io.to(socketId).emit('requestTableItemComplete', tableConfig);

            console.log('Table configuration sent to client');

            // Close the connection
            await connection.end();
            console.log('Database connection closed');

            return { success: 'SQL executed and table configuration sent to client' };
        } catch (error) {
            console.error('Query execution failed:', error.message);
            return { error: error.message };
        }
    } catch (error) {
        console.error('SQL execution error:', {
            message: error.message,
            stack: error.stack
        });
        return `SQL execution fail: ${error.message}`;
    }
}
